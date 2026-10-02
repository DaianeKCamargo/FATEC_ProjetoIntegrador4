# CRIACAO DA BALANCA

## COMPONENTES E QUAL E A SUA FUNCAO

### ESP32

O ESP32 e o microcontrolador responsavel por executar o programa, receber os dados do HX711 e exibir as informacoes no monitor serial. Ele tambem fornece a alimentacao de 3,3 V para o modulo HX711.

### HX711

O HX711 e o modulo utilizado para fazer a leitura da celula de carga. Ele amplifica e converte o sinal eletrico gerado pela celula, permitindo que o ESP32 obtenha um valor de peso.

No diagrama do Wokwi, o componente esta configurado como uma celula de carga de 5 kg.

### CELULA DE CARGA

A celula de carga e o sensor que sofre uma pequena deformacao quando um peso e colocado sobre a balanca. Essa deformacao altera o sinal eletrico enviado ao HX711.

## LIGACOES DO CIRCUITO

| HX711 | ESP32 | Funcao |
| --- | --- | --- |
| VCC | 3V3 | Alimentacao do modulo |
| GND | GND.2 | Terra |
| DT | GPIO 4 | Dados da leitura |
| SCK | GPIO 5 | Clock da comunicacao |

O monitor serial e conectado aos pinos TX e RX do ESP32. No codigo, a comunicacao serial usa a velocidade de `115200` bauds.

## CONFIGURACAO DO PROJETO

O projeto utiliza o PlatformIO com:

- Placa `esp32doit-devkit-v1`;
- Framework Arduino;
- Plataforma `espressif32`;
- Biblioteca `bogde/HX711`.

## FUNCIONAMENTO DO PROGRAMA

### Bibliotecas e pinos

O programa inclui `Arduino.h` e `HX711.h`. Os pinos utilizados sao definidos da seguinte forma:

```cpp
#define DT 4
#define SCK 5
```

Depois, e criado o objeto `balanca` do tipo `HX711`, que representa o modulo de leitura.

### Inicializacao

Na funcao `setup()`:

1. A comunicacao serial e iniciada em `115200` bauds.
2. Sao exibidas mensagens informando o inicio do sistema de doacao de tampinhas.
3. O HX711 e iniciado com os pinos `DT` e `SCK`.
4. O programa informa que o HX711 foi configurado.

### Leitura do peso

Na funcao `loop()`, o programa verifica se o HX711 esta pronto usando `balanca.is_ready()`.

Quando o modulo esta pronto, sao realizadas cinco leituras. Cada leitura bruta e dividida pelo fator de calibracao `419.5` e o resultado e exibido em quilogramas:

```cpp
const float fator_calibracao = 419.5;
const int num_leituras = 5;
```

Existe um intervalo de um segundo entre cada leitura.

Se o HX711 nao estiver pronto, o programa informa no monitor serial que nao foi possivel realizar a leitura.

## VERIFICACAO DA ESTABILIDADE

Depois das cinco leituras, o programa identifica o menor e o maior valor obtido. Em seguida, calcula a variacao:

```text
variacao = maior - menor
```

O peso e considerado estavel quando a variacao e menor ou igual a `0.02 kg`:

```cpp
const float variacao_max = 0.02;
```

O monitor serial exibe:

- A menor leitura;
- A maior leitura;
- A variacao encontrada;
- A mensagem `PESO ESTAVEL!` ou `PESO INSTAVEL!`.

Ao final de cada ciclo, o programa aguarda mais um segundo antes de iniciar novas verificacoes.

## MENSAGENS EXIBIDAS

Durante a execucao, podem aparecer mensagens como:

```text
SISTEMA DE DOACAO DE TAMPINHAS
Iniciando balanca...
HX711 configurado!
HX711 pronto?
PESO ESTAVEL!
```

Quando ha problema de comunicacao com o modulo, e exibida a mensagem:

```text
HX711 nao esta pronto!
```

## CALIBRACAO

O fator utilizado atualmente e `419.5`. Esse valor deve ser ajustado caso as leituras do peso real estejam diferentes das leituras exibidas pelo sistema. A calibracao deve ser feita utilizando um peso conhecido e comparando o valor medido com o valor esperado.

## RESUMO DO FLUXO

```text
Iniciar ESP32
	-> Configurar comunicacao serial
	-> Inicializar HX711
	-> Verificar se o HX711 esta pronto
	-> Fazer 5 leituras
	-> Converter as leituras usando o fator de calibracao
	-> Encontrar menor, maior e variacao
	-> Informar se o peso esta estavel
	-> Repetir o processo
```
