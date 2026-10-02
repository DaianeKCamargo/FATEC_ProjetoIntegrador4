// import de bibliotecas
#include <Arduino.h>
#include <HX711.h>

// definição de portas
#define DT 4
#define SCK 5

// criação do objeto balanca onde HX711 é o tipo (importado da biblioteca) e balanca o objeto criado.
HX711 balanca;

// declarações de variaveis
const float fator_calibracao = 419.5;
const int num_leituras = 5;
const float variacao_max = 0.02;
float peso_final = 0;

float leituras[num_leituras];

// setup onde queremos que a execução seja feita apenas 1x 
void setup()
{
  Serial.begin(115200);

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

      Serial.println("PESO ESTAVEL!");
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