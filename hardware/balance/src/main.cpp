
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <stdlib.h>
#include <math.h>
#include "HX711.h"

// ------------------------------
// CONFIGURACOES DA BALANCA
// ------------------------------

#define DT 4
#define SCK 5

HX711 balanca;
WebServer servidorConfiguracao(80);
Preferences preferencias;

float fator_calibracao = 0.0;
long offset_tara = 0;
bool taraConfigurada = false;

// ------------------------------
// CONFIGURACOES DO SERVIDOR
// ------------------------------

const char *servidor = "https://weight-websocket.onrender.com/peso";
String ssid;
String senha;
String pontoId;
bool modoConfiguracao = false;
bool botaoConfiguracaoPressionado = false;
unsigned long inicioPressionamentoBotao = 0;
unsigned long ultimaTentativaWiFi = 0;

// Intervalo de envio: 1 segundo
unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 1000;
int ultimoEstadoWiFi = -1;

// ------------------------------
// CONFIGURACAO WI-FI
// ------------------------------

void responderErroConfiguracao(int codigo, const char *mensagem)
{
    JsonDocument resposta;
    resposta["message"] = mensagem;

    String corpo;
    serializeJson(resposta, corpo);
    servidorConfiguracao.send(codigo, "application/json", corpo);
}

bool aguardarSensorBalanca()
{
    return balanca.wait_ready_timeout(2000);
}

bool salvarTara()
{
    if (!preferencias.begin("balanca", false))
    {
        return false;
    }

    offset_tara = balanca.get_offset();
    size_t bytesOffset = preferencias.putLong("offset", offset_tara);
    size_t bytesStatus = preferencias.putBool("taraOk", true);
    preferencias.end();

    taraConfigurada =
        bytesOffset == sizeof(offset_tara) && bytesStatus == sizeof(bool);
    return taraConfigurada;
}

void zerarBalanca()
{
    Serial.println("Aguardando 3 segundos para estabilizar a plataforma vazia.");
    delay(3000);

    if (!aguardarSensorBalanca())
    {
        responderErroConfiguracao(
            503,
            "HX711 nao respondeu em 2 segundos. Confira alimentacao, DT e SCK.");
        return;
    }

    balanca.tare(20);

    if (!salvarTara())
    {
        responderErroConfiguracao(500, "Nao foi possivel salvar o zero da balanca.");
        return;
    }

    JsonDocument resposta;
    resposta["message"] = "Balanca zerada.";
    String corpo;
    serializeJson(resposta, corpo);
    servidorConfiguracao.send(200, "application/json", corpo);
}

void calibrarBalanca()
{
    if (!taraConfigurada)
    {
        responderErroConfiguracao(409, "Zere a balanca vazia antes de calibrar.");
        return;
    }

    JsonDocument configuracao;
    DeserializationError erro =
        deserializeJson(configuracao, servidorConfiguracao.arg("plain"));

    if (erro)
    {
        responderErroConfiguracao(400, "Conteudo de calibragem invalido.");
        return;
    }

    float pesoReferencia = configuracao["referenceWeight"] | 0.0f;

    if (!isfinite(pesoReferencia) || pesoReferencia <= 0.0f)
    {
        responderErroConfiguracao(400, "Informe um peso de referencia valido.");
        return;
    }

    Serial.println("Aguardando 1 minuto para estabilizar o peso de referencia.");
    delay(60000);

    const uint8_t quantidadeAmostras = 10;
    double amostras[quantidadeAmostras];
    double somaAmostras = 0.0;
    double menorAmostra = 0.0;
    double maiorAmostra = 0.0;

    for (uint8_t indice = 0; indice < quantidadeAmostras; indice++)
    {
        if (!aguardarSensorBalanca())
        {
            responderErroConfiguracao(
                503,
                "HX711 nao respondeu em 2 segundos. Confira alimentacao, DT e SCK.");
            return;
        }

        amostras[indice] = balanca.get_value(10);
        somaAmostras += amostras[indice];

        if (indice == 0 || amostras[indice] < menorAmostra)
        {
            menorAmostra = amostras[indice];
        }
        if (indice == 0 || amostras[indice] > maiorAmostra)
        {
            maiorAmostra = amostras[indice];
        }
    }

    double leituraMedia = somaAmostras / quantidadeAmostras;

    if (!isfinite(leituraMedia) || fabs(leituraMedia) < 1000.0 ||
        maiorAmostra - menorAmostra > fabs(leituraMedia) * 0.01)
    {
        responderErroConfiguracao(
            422,
            "Leitura instavel. Aguarde o peso parar de oscilar e tente novamente.");
        return;
    }

    float novoFator = leituraMedia / pesoReferencia;

    if (!isfinite(novoFator) || fabs(novoFator) < 1.0f)
    {
        responderErroConfiguracao(422, "Leitura insuficiente para calibrar.");
        return;
    }

    balanca.set_scale(novoFator);

    double somaVerificacao = 0.0;
    double menorVerificacao = 0.0;
    double maiorVerificacao = 0.0;

    for (uint8_t indice = 0; indice < quantidadeAmostras; indice++)
    {
        if (!aguardarSensorBalanca())
        {
            balanca.set_scale(fator_calibracao);
            responderErroConfiguracao(
                503,
                "HX711 nao respondeu em 2 segundos. Confira alimentacao, DT e SCK.");
            return;
        }

        double leitura = balanca.get_units(5);
        somaVerificacao += leitura;

        if (indice == 0 || leitura < menorVerificacao)
        {
            menorVerificacao = leitura;
        }
        if (indice == 0 || leitura > maiorVerificacao)
        {
            maiorVerificacao = leitura;
        }
    }

    double pesoVerificado = somaVerificacao / quantidadeAmostras;
    if (!isfinite(pesoVerificado) || pesoVerificado <= 0.0 ||
        maiorVerificacao - menorVerificacao > pesoReferencia * 0.01 ||
        fabs(pesoVerificado - pesoReferencia) > pesoReferencia * 0.02)
    {
        balanca.set_scale(fator_calibracao);
        responderErroConfiguracao(
            422,
            "Peso de referencia instavel ou leitura fora de 2%. Aguarde a estabilizacao e tente novamente.");
        return;
    }

    if (!preferencias.begin("balanca", false))
    {
        balanca.set_scale(fator_calibracao);
        responderErroConfiguracao(500, "Nao foi possivel abrir o armazenamento.");
        return;
    }

    size_t bytesSalvos = preferencias.putFloat("fator", novoFator);
    preferencias.end();

    if (bytesSalvos != sizeof(novoFator))
    {
        balanca.set_scale(fator_calibracao);
        responderErroConfiguracao(500, "Nao foi possivel salvar a calibragem.");
        return;
    }

    fator_calibracao = novoFator;

    Serial.print("Peso de referencia: ");
    Serial.print(pesoReferencia, 3);
    Serial.print(" kg; peso verificado: ");
    Serial.print(pesoVerificado, 3);
    Serial.print(" kg; leitura bruta media: ");
    Serial.print(leituraMedia, 1);
    Serial.print("; fator salvo: ");
    Serial.println(fator_calibracao, 3);

    JsonDocument resposta;
    resposta["message"] = "Calibragem salva.";
    resposta["factor"] = fator_calibracao;
    resposta["measuredWeight"] = pesoVerificado;
    String corpo;
    serializeJson(resposta, corpo);
    servidorConfiguracao.send(200, "application/json", corpo);
}

void receberConfiguracao()
{
    JsonDocument configuracao;
    DeserializationError erro =
        deserializeJson(configuracao, servidorConfiguracao.arg("plain"));

    if (erro)
    {
        responderErroConfiguracao(400, "Conteúdo de configuração inválido.");
        return;
    }

    String novaSsid = configuracao["ssid"] | "";
    String novaSenha = configuracao["password"] | "";
    String novoPontoId = configuracao["pontoId"] | "";

    char *fimPontoId;
    long idPonto = strtol(novoPontoId.c_str(), &fimPontoId, 10);

    if (novaSsid.length() == 0 || novaSsid.length() > 32 ||
        novaSenha.length() > 63 ||
        (novaSenha.length() > 0 && novaSenha.length() < 8) ||
        fimPontoId == novoPontoId.c_str() || *fimPontoId != '\0' ||
        idPonto <= 0)
    {
        responderErroConfiguracao(400, "Dados de Wi-Fi ou ponto inválidos.");
        return;
    }

    if (!taraConfigurada || fator_calibracao == 0.0f)
    {
        responderErroConfiguracao(
            409,
            "Zere e calibre a balanca antes de configurar o Wi-Fi.");
        return;
    }

    if (!preferencias.begin("balanca", false))
    {
        responderErroConfiguracao(500, "Nao foi possivel abrir o armazenamento.");
        return;
    }

    bool configuracaoSalva =
        preferencias.putString("ssid", novaSsid) > 0 &&
        preferencias.putString("senha", novaSenha) > 0 &&
        preferencias.putString("pontoId", novoPontoId) > 0;
    preferencias.end();

    if (!configuracaoSalva)
    {
        responderErroConfiguracao(500, "Nao foi possivel salvar a configuracao.");
        return;
    }

    Serial.println("Wi-Fi e ponto de coleta salvos.");
    JsonDocument resposta;
    resposta["message"] = "Configuração salva. A balança será reiniciada.";
    String corpo;
    serializeJson(resposta, corpo);
    servidorConfiguracao.send(200, "application/json", corpo);

    Serial.println("Reiniciando para aplicar a configuracao.");
    delay(2000);
    ESP.restart();
}

void iniciarModoConfiguracao()
{
    if (modoConfiguracao)
    {
        return;
    }

    modoConfiguracao = true;
    WiFi.disconnect(true, true);
    WiFi.mode(WIFI_AP);

    String mac = WiFi.macAddress();
    mac.replace(":", "");
    String nomeRede = "TamPets-Config-" + mac.substring(mac.length() - 6);

    if (!WiFi.softAP(nomeRede.c_str()))
    {
        Serial.println("Falha ao iniciar o ponto de acesso da balanca.");
        modoConfiguracao = false;
        return;
    }

    servidorConfiguracao.on("/configure", HTTP_POST, receberConfiguracao);
    servidorConfiguracao.on("/tare", HTTP_POST, zerarBalanca);
    servidorConfiguracao.on("/calibrate", HTTP_POST, calibrarBalanca);
    servidorConfiguracao.onNotFound([]()
                                    { responderErroConfiguracao(404, "Rota nao encontrada."); });
    servidorConfiguracao.begin();

    Serial.println("Modo de configuracao ativo.");
    Serial.print("Conecte-se a rede: ");
    Serial.println(nomeRede);
    Serial.print("Endereco de configuracao: http://");
    Serial.println(WiFi.softAPIP());
}

void iniciarConexaoWiFi()
{
    if (ssid.length() == 0 || pontoId.length() == 0 ||
        !taraConfigurada || fator_calibracao == 0.0f)
    {
        iniciarModoConfiguracao();
        return;
    }

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(ssid.c_str(), senha.c_str());
    ultimaTentativaWiFi = millis();
    Serial.println("Conectando ao Wi-Fi configurado...");
}

const char *descricaoStatusWiFi(wl_status_t status)
{
    switch (status)
    {
    case WL_CONNECTED:
        return "conectado";
    case WL_NO_SSID_AVAIL:
        return "rede nao encontrada (confira o SSID e se e 2.4 GHz)";
    case WL_CONNECT_FAILED:
        return "falha de conexao (confira a senha)";
    case WL_CONNECTION_LOST:
        return "conexao perdida";
    case WL_DISCONNECTED:
        return "desconectado";
    case WL_IDLE_STATUS:
        return "tentando conectar";
    default:
        return "estado desconhecido";
    }
}

// ------------------------------
// ENVIO DO PESO
// ------------------------------

void enviarPeso(float peso)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        return;
    }

    WiFiClientSecure cliente;

    // Para o primeiro teste de integracao.
    cliente.setInsecure();

    HTTPClient http;

    if (!http.begin(cliente, servidor))
    {
        Serial.println("Falha ao iniciar conexao HTTP.");
        return;
    }

    http.addHeader("Content-Type", "application/json");

    String json = "{\"pontoId\":\"";
    json += pontoId;
    json += "\",\"peso\":";
    json += String(peso, 3);
    json += "}";

    Serial.print("Enviando: ");
    Serial.println(json);

    int codigoHTTP = http.POST(json);

    if (codigoHTTP > 0)
    {
        Serial.print("Codigo HTTP: ");
        Serial.println(codigoHTTP);

        String resposta = http.getString();

        Serial.print("Resposta: ");
        Serial.println(resposta);
    }
    else
    {
        Serial.print("Erro no envio: ");
        Serial.println(http.errorToString(codigoHTTP));
    }

    http.end();
}

// ------------------------------
// INICIALIZACAO
// ------------------------------

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println("=== BALANCA TAMPETS ===");

    pinMode(0, INPUT_PULLUP);

    preferencias.begin("balanca", true);
    ssid = preferencias.getString("ssid", "");
    senha = preferencias.getString("senha", "");
    pontoId = preferencias.getString("pontoId", "");
    fator_calibracao = preferencias.getFloat("fator", 0.0f);
    offset_tara = preferencias.getLong("offset", 0);
    taraConfigurada = preferencias.getBool("taraOk", false);
    preferencias.end();
    if (!isfinite(fator_calibracao))
    {
        fator_calibracao = 0.0f;
    }

    // Inicializa o HX711
    balanca.begin(DT, SCK);

    if (fator_calibracao != 0.0f)
    {
        balanca.set_scale(fator_calibracao);
    }
    if (taraConfigurada)
    {
        balanca.set_offset(offset_tara);
    }

    iniciarConexaoWiFi();

    Serial.println(
        taraConfigurada ? "Zero da balanca carregado." : "Zere a balanca pelo app.");
    Serial.print("Fator de calibracao carregado: ");
    Serial.println(fator_calibracao, 3);
    if (fator_calibracao == 0.0f)
    {
        Serial.println("Calibragem pendente. Configure a balanca pelo app.");
    }
    Serial.println("Iniciando balanca...");
}

// ------------------------------
// EXECUCAO PRINCIPAL
// ------------------------------

void loop()
{
    if (modoConfiguracao)
    {
        servidorConfiguracao.handleClient();
        return;
    }

    if (digitalRead(0) == LOW)
    {
        if (!botaoConfiguracaoPressionado)
        {
            botaoConfiguracaoPressionado = true;
            inicioPressionamentoBotao = millis();
        }
        else if (millis() - inicioPressionamentoBotao >= 5000)
        {
            iniciarModoConfiguracao();
            return;
        }
    }
    else
    {
        botaoConfiguracaoPressionado = false;
    }

    wl_status_t estadoWiFi = WiFi.status();
    int codigoEstadoWiFi = static_cast<int>(estadoWiFi);
    if (codigoEstadoWiFi != ultimoEstadoWiFi)
    {
        Serial.print("Estado do Wi-Fi: ");
        Serial.println(descricaoStatusWiFi(estadoWiFi));
        ultimoEstadoWiFi = codigoEstadoWiFi;
    }

    if (estadoWiFi != WL_CONNECTED &&
        millis() - ultimaTentativaWiFi >= 15000)
    {
        Serial.println("Tentando reconectar ao Wi-Fi configurado...");
        WiFi.begin(ssid.c_str(), senha.c_str());
        ultimaTentativaWiFi = millis();
    }

    if (estadoWiFi == WL_CONNECTED && ultimaTentativaWiFi != 0)
    {
        Serial.println("Wi-Fi conectado!");
        Serial.print("Endereco IP: ");
        Serial.println(WiFi.localIP());
        ultimaTentativaWiFi = 0;
    }

    if (fator_calibracao == 0.0f)
    {
        if (millis() - ultimoEnvio >= intervaloEnvio)
        {
            ultimoEnvio = millis();
            Serial.println("Balanca sem calibragem.");
        }
        return;
    }

    if (millis() - ultimoEnvio >= intervaloEnvio)
    {
        ultimoEnvio = millis();

        if (balanca.is_ready())
        {
            float peso = balanca.get_units(5);

            if (peso < 0)
            {
                Serial.println("Leitura abaixo da tara. Verifique o zero e o peso na plataforma.");
                Serial.print("Peso calculado: ");
                Serial.print(peso, 3);
                Serial.print(" kg; fator interno: ");
                Serial.print(fator_calibracao, 3);
                Serial.println(" contagens/kg (nao e o peso).");
                peso = 0.0;
            }

            Serial.print("Peso: ");
            Serial.print(peso, 3);
            Serial.println(" kg");

            enviarPeso(peso);
        }
        else
        {
            Serial.println("HX711 nao esta pronto!");
        }
    }
}
