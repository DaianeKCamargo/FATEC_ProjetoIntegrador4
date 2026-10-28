
#include <Arduino.h>
#include <HX711.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Definicao dos pinos
#define DT 4
#define SCK 5

// Configuracao Wi-Fi
const char *SSID = "Wokwi-GUEST";
const char *SENHA = "";

// Deve ser igual ao identificador do QR Code
const char *PONTO_ID = "PONTO-001";

// Endereco da API
const char *WEBSOCKET_API_URL =
    "https://weight-websocket.onrender.com";

// Configuracao da balanca
HX711 balanca;

const float fator_calibracao = 419.5;
const int num_leituras = 5;
const float peso_minimo = 0.05;

// Intervalo entre verificacoes da sessao
const unsigned long intervalo_leitura = 1000;
unsigned long ultima_leitura = 0;

// Conecta ao Wi-Fi
void conectar_wifi()
{
    Serial.print("Conectando ao Wi-Fi: ");
    Serial.println(SSID);

    WiFi.begin(SSID, SENHA);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.println("Conectando...");
    }

    Serial.println("Wi-Fi conectado!");
    Serial.print("Endereco IP: ");
    Serial.println(WiFi.localIP());
}

// Verifica se existe uma sessao de pesagem ativa
bool verificarSessaoAtiva()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        return false;
    }

    WiFiClientSecure cliente;
    cliente.setInsecure(); // Somente para testes no Wokwi

    HTTPClient https;

    String url = String(WEBSOCKET_API_URL) +
                 "/pontos/" + PONTO_ID +
                 "/pesagem/atual";

    if (!https.begin(cliente, url))
    {
        Serial.println("Erro ao consultar a sessao.");
        return false;
    }

    https.setTimeout(3000);

    int codigoHTTP = https.GET();

    // A API retorna 200 quando existe uma sessao ativa.
    // Retorna 404 quando nao existe sessao ativa.
    bool ativa = (codigoHTTP == 200);

    if (codigoHTTP < 0)
    {
        Serial.print("Falha na consulta: ");
        Serial.println(https.errorToString(codigoHTTP));
    }

    https.end();

    return ativa;
}

// Envia uma leitura temporaria para a API
bool enviarLeitura(float peso)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Wi-Fi desconectado!");
        return false;
    }

    WiFiClientSecure cliente;
    cliente.setInsecure(); // Somente para testes no Wokwi

    HTTPClient https;

    String url = String(WEBSOCKET_API_URL) + "/peso";

    if (!https.begin(cliente, url))
    {
        Serial.println("Erro ao iniciar requisicao HTTPS.");
        return false;
    }

    https.setTimeout(5000);
    https.addHeader("Content-Type", "application/json");

    String corpoJSON = "{\"pontoId\":\"";
    corpoJSON += PONTO_ID;
    corpoJSON += "\",\"peso\":";
    corpoJSON += String(peso, 3);
    corpoJSON += "}";

    int codigoHTTP = https.POST(corpoJSON);

    bool sucesso = codigoHTTP >= 200 && codigoHTTP < 300;

    if (sucesso)
    {
        Serial.print("Leitura enviada ao WebSocket: ");
        Serial.print(peso, 3);
        Serial.println(" kg");
    }
    else
    {
        Serial.print("Erro HTTP ao enviar leitura: ");
        Serial.println(codigoHTTP);

        if (codigoHTTP > 0)
        {
            Serial.println(https.getString());
        }
        else
        {
            Serial.println(https.errorToString(codigoHTTP));
        }
    }

    https.end();

    return sucesso;
}

// Inicializacao
void setup()
{
    Serial.begin(115200);

    Serial.println("==============================");
    Serial.println("SISTEMA DE DOACAO DE TAMPINHAS");
    Serial.println("==============================");

    conectar_wifi();

    balanca.begin(DT, SCK);

    Serial.println("HX711 configurado!");
}

// Execucao continua
void loop()
{
    // Reconecta caso o Wi-Fi caia
    if (WiFi.status() != WL_CONNECTED)
    {
        conectar_wifi();
    }

    // Aguarda o intervalo entre leituras
    if (millis() - ultima_leitura < intervalo_leitura)
    {
        return;
    }

    ultima_leitura = millis();

    // Nao envia leituras quando nao ha sessao ativa
    if (!verificarSessaoAtiva())
    {
        Serial.println("Nenhuma sessao de pesagem ativa.");
        return;
    }

    // Verifica se o sensor esta pronto
    if (!balanca.is_ready())
    {
        Serial.println("HX711 nao esta pronto.");
        return;
    }

    // Calcula a leitura media atual
    float pesoAtual =
        balanca.read_average(num_leituras) / fator_calibracao;

    // Evita exibir pequenos valores residuais como peso real
    if (pesoAtual < peso_minimo)
    {
        pesoAtual = 0.0;
    }

    Serial.print("Peso atual: ");
    Serial.print(pesoAtual, 3);
    Serial.println(" kg");

    // Envia somente a leitura temporaria.
    // Esta rota nao cria registros na tabela de doacoes.
    enviarLeitura(pesoAtual);
}
