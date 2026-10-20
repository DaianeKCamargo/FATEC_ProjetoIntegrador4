// import de bibliotecas
#include <Arduino.h>
#include <HX711.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// definição de portas
#define DT 4
#define SCK 5

// definindo a rede wifi
const char *SSID = "Wokwi-GUEST";
const char *SENHA = "";
const char *PONTO_ID = "PONTO_001";

// criação do objeto balanca onde HX711 é o tipo (importado da biblioteca) e balanca o objeto criado.
HX711 balanca;

// declarações de variaveis
const float fator_calibracao = 419.5; // ajustar na aplicação real
const int num_leituras = 5;
const float variacao_max = 0.02; // ajustar na aplicação real
float peso_final = 0;
const float peso_minimo = 0.05;

float leituras[num_leituras];

// Controle para nao enviar a mesma doacao repetidamente
bool doacao_enviada = false;

// Função de conexão
void conectar_wifi()
{
  Serial.print("Conectando-se a rede Wi-Fi: ");
  Serial.println(SSID);

  WiFi.begin(SSID, SENHA);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Conectando...");
  }

  Serial.println("Conectado com sucesso!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
}

// Função para enviar a doação para a API
// aqui a função evita enviar uma doação que tenha falhado mas não evita enviar em duplicidade, sendo assim na aplicação real deve haver um controlador como um identificador unico para cada doação, que pode ser o timestamp da doação ou um ID gerado pelo sistema.
bool enviarDoacao(float peso)
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Erro: Wi-Fi desconectado!");
    return false;
  }

  WiFiClientSecure cliente;
  cliente.setInsecure(); // Apenas para teste no Wokwi - mudar essa parte na aplicação real para usar certificados válidos.

  HTTPClient https;

  const char *url =
      "https://fatec-balanca.vercel.app/doacoes";

  if (!https.begin(cliente, url))
  {
    Serial.println("Erro ao iniciar conexao HTTPS!");
    return false;
  }

  https.addHeader("Content-Type", "application/json");

  String corpoJSON = "{\"peso\":";
  corpoJSON += String(peso, 2);
  corpoJSON += ",\"pontoId\":\"";
  corpoJSON += PONTO_ID;
  corpoJSON += "\"}";

  Serial.println("Enviando doacao para a API...");
  Serial.print("JSON enviado: ");
  Serial.println(corpoJSON);

  int codigoHTTP = https.POST(corpoJSON);

  if (codigoHTTP > 0)
  {
    Serial.print("Codigo HTTP: ");
    Serial.println(codigoHTTP);

    String resposta = https.getString();

    Serial.println("Resposta da API:");
    Serial.println(resposta);

    if (codigoHTTP >= 200 && codigoHTTP < 300)
    {
      Serial.println("Doacao enviada com sucesso!");
      https.end();
      return true;
    }
    else
    {
      Serial.println("A API retornou um erro HTTP.");
    }
  }
  else
  {
    Serial.print("Falha na requisicao: ");
    Serial.println(https.errorToString(codigoHTTP));
  }

  https.end();
  return false;
}

// setup onde queremos que a execução seja feita apenas uma vez.
void setup()
{
  Serial.begin(115200);

  conectar_wifi();

  Serial.println("================================");
  Serial.println("SISTEMA DE DOACAO DE TAMPINHAS");
  Serial.println("Iniciando balanca...");
  Serial.println("================================");

  balanca.begin(DT, SCK);

  Serial.println("HX711 configurado!");
}

// onde queremos que a execução seja feita repetidas vezes.
void loop()
{
  Serial.println("HX711 pronto? ");

  // primeira condição para iniciar, assim consegue saber que ele está conseguindo se comunicar com o HX711
  if (balanca.is_ready())
  {
    for (int i = 0; i < num_leituras; i++)
    {
      long leitura = balanca.read();

      leituras[i] = leitura / fator_calibracao;

      Serial.print("Leitura: ");
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(leituras[i], 2);
      Serial.println(" kg");

      delay(1000);
    }

    float menor = leituras[0];
    float maior = leituras[0];

    for (int i = 1; i < num_leituras; i++)
    {
      if (leituras[i] < menor)
      {
        menor = leituras[i];
      }

      if (leituras[i] > maior)
      {
        maior = leituras[i];
      }
    }

    float variacao = maior - menor;

    Serial.println("========================================");
    Serial.print("Menor: ");
    Serial.print(menor, 2);
    Serial.println(" kg");

    Serial.print("Maior: ");
    Serial.print(maior, 2);
    Serial.println(" kg");

    Serial.print("Variacao: ");
    Serial.print(variacao, 2);
    Serial.println(" kg");

    if (variacao <= variacao_max)
    {
      float soma = 0;

      for (int i = 0; i < num_leituras; i++)
      {
        soma += leituras[i];
      }

      peso_final = soma / num_leituras;

      Serial.println("PESO ESTAVEL!");

      Serial.print("Peso final da doacao: ");
      Serial.print(peso_final, 2);
      Serial.println(" kg");

      // Se a balanca estiver vazia, libera a proxima doacao
      if (peso_final <= peso_minimo)
      {
        doacao_enviada = false;
        Serial.println("Balanca vazia ou sem peso suficiente.");
      }
      // Envia somente se ainda nao enviou esta doacao
      else if (!doacao_enviada)
      {
        if (enviarDoacao(peso_final))
        {
          doacao_enviada = true;
        }
      }
      else
      {
        Serial.println("Esta doacao ja foi enviada.");
      }
    }
    else
    {

      Serial.println("PESO INSTAVEL!");
    }

    Serial.println("-------------------------------");
  }
  else
  {

    Serial.println("HX711 nao esta pronto!");
  }

  delay(1000);
}