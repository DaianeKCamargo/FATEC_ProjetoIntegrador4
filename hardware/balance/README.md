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
- Bibliotecas `bogde/HX711` e `bblanchon/ArduinoJson`.

## COMO RODAR O PROJETO

1. Instale o Visual Studio Code e a extensao PlatformIO IDE.
2. Clone o repositorio e abra a pasta `Balanca` no Visual Studio Code.
3. Aguarde o PlatformIO instalar automaticamente a plataforma ESP32 e as bibliotecas do projeto.
4. Conecte o ESP32 ao computador usando um cabo USB.
5. Compile o projeto pelo PlatformIO ou execute no terminal:

	```bash
	pio run
	```

6. Envie o programa para o ESP32:

	```bash
	pio run --target upload
	```

7. Abra o monitor serial para acompanhar as leituras:

	```bash
	pio device monitor --baud 115200
	```

## CONFIGURACAO PELO APP ADMINISTRATIVO

1. Grave o firmware atualizado no ESP32. No primeiro uso, ou se faltar zero/calibragem, ele inicia a rede Wi-Fi `TamPets-Config-<final do MAC>`.
2. Conecte o celular à rede `TamPets-Config` da balança. Se o celular avisar que não há internet, mantenha a conexão e abra **Configurações** no app administrativo.
3. Selecione o ponto de coleta. Com a plataforma vazia, toque em **Zerar balança sem peso**.
4. Com a plataforma vazia, toque em zerar; o ESP32 aguarda 3 segundos e registra o offset com `tare(20)`. Coloque um peso conhecido, informe o valor em quilogramas e toque em **Calibrar com peso de referência**. O firmware aguarda 1 minuto para o peso estabilizar, coleta dez medias com `get_value(10)` (que ja desconta a tara) e calcula `fator = leitura bruta / peso conhecido em kg`. Ele confere novas leituras com `get_units(5)` e só salva o fator se a oscilacao e a diferenca ficarem dentro dos limites. A tela mostra o peso verificado e o fator interno em contagens/kg; o fator nao e o peso e pode ter sinal negativo conforme a polaridade da celula de carga.
5. Informe o nome e a senha da rede Wi-Fi do local (2,4 GHz) e envie a configuração. O ESP32 salva o Wi-Fi e o ID do ponto e reinicia. A mensagem do app confirma que os dados foram salvos, não que a conexão foi concluída.
6. Para calibrar ou configurar novamente, mantenha o ESP32 ligado e segure o botão **BOOT** por 5 segundos; conecte o celular à rede `TamPets-Config` que aparecer e repita o processo.

A rede de configuração é aberta e fica ativa enquanto faltar configuração ou após a ativação física pelo botão BOOT. A senha da rede do local é enviada diretamente ao ESP32 e não é armazenada no banco de dados. O offset de zero e o fator são preservados na memória do ESP32, inclusive após reinicializações.

No monitor serial, `Estado do Wi-Fi: conectado` confirma a conexão. `rede nao encontrada` indica que o SSID não foi localizado; `falha de conexao` indica que a rede ou senha deve ser conferida. O ESP32 envia as leituras ao servidor somente quando conectado ao Wi-Fi.

Com a plataforma vazia, leituras abaixo de zero sao enviadas como `0.000 kg`, para que a interface continue mostrando zero em vez de manter um valor antigo.

Para executar a simulacao, instale a extensao Wokwi for VS Code, abra o arquivo `diagram.json` no Visual Studio Code e inicie a simulacao pela extensao. O monitor serial do Wokwi exibira as mensagens do programa. Antes de iniciar, compile o projeto com `pio run` para gerar os arquivos necessarios.

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

Quando o modulo esta pronto e a balanca foi calibrada pelo app, sao realizadas cinco leituras. Cada leitura bruta e dividida pelo fator salvo na memoria do ESP32 e o resultado e exibido em quilogramas. Sem zero ou calibragem, o programa nao envia leituras.

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

A calibracao e feita pelo app administrativo com um peso conhecido. Primeiro, a plataforma deve estar vazia para salvar o offset de zero; em seguida, coloca-se o peso de referencia e informa-se seu valor em quilogramas. O ESP32 calcula e salva o fator, validando se as leituras estao estaveis. A tara e o fator permanecem salvos apos reinicializacoes.

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
