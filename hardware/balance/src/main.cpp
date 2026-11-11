
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "HX711.h"

// ------------------------------
// CONFIGURACOES DA BALANCA
// ------------------------------

#define DT 4
#define SCK 5

HX711 balanca;

float fator_calibracao = 300743.0;

// ------------------------------
// CONFIGURACOES DO WIFI
// ------------------------------

const char *ssid = "Desktop_F7665003";
const char *senha = "CamarG0291";

// ------------------------------
// CONFIGURACOES DO SERVIDOR
// ------------------------------

const char *servidor = "https://weight-websocket.onrender.com/peso";

const char *pontoId = "8";

// Intervalo de envio: 1 segundo
unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 1000;

// ------------------------------
// CONEXAO WIFI
// ------------------------------

void conectarWiFi()
{
    Serial.println("Conectando ao Wi-Fi...");

    WiFi.begin(ssid, senha);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("Wi-Fi conectado!");

    Serial.print("Endereco IP: ");
    Serial.println(WiFi.localIP());
}

// ------------------------------
// ENVIO DO PESO
// ------------------------------

void enviarPeso(float peso)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Wi-Fi desconectado!");
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

    // Inicializa o HX711
    balanca.begin(DT, SCK);

    balanca.set_scale(fator_calibracao);

    // Conecta ao Wi-Fi
    conectarWiFi();

    // Aguarda estabilizacao e executa a tara
    Serial.println("Retire todos os pesos da balanca.");

    delay(5000);

    balanca.tare();

    Serial.println("Balanca zerada!");
    Serial.println("Iniciando envio de peso...");
}

// ------------------------------
// EXECUCAO PRINCIPAL
// ------------------------------

void loop()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        conectarWiFi();
    }

    if (millis() - ultimoEnvio >= intervaloEnvio)
    {
        ultimoEnvio = millis();

        if (balanca.is_ready())
        {
            float peso = balanca.get_units(5);

            // Corrige pequenas variacoes negativas
            if (peso < 0 && peso >= -0.01)
            {
                peso = 0.0;
            }

            // Nao envia leituras negativas
            if (peso < 0)
            {
                Serial.println("Peso negativo. Verifique a calibracao.");
                return;
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
