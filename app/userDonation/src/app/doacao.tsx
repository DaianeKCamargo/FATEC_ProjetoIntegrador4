
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CollectionPoint } from '@/constants/collection-points';
import { getCollectionPoint } from '@/services/collection-points';

const API_URL = 'https://fatec-balanca.vercel.app';
const WEBSOCKET_URL = 'wss://weight-websocket.onrender.com';
const TEMPO_LIMITE_BALANCA_MS = 5000;

type Status = 'idle' | 'waiting' | 'ready' | 'finished';

type MensagemWebSocket =
  | {
      tipo: 'sessao_iniciada';
      pontoId: string;
    }
  | {
      tipo: 'leitura_peso';
      pontoId: string;
      peso: number;
    }
  | {
      tipo: 'erro';
      codigo?: string;
      mensagem?: string;
    };

async function salvarDoacao(pontoId: string, peso: number) {
  const resposta = await fetch(`${API_URL}/doacoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pontoId,
      peso,
    }),
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(`Não foi possível salvar a doação: ${texto}`);
  }

  return texto ? JSON.parse(texto) : {};
}

function ProgressBar() {
  return (
    <View className="mb-5 w-full">
      <View className="w-full rounded-[22px] border border-[#D9E2F1] bg-white px-4 py-4 dark:border-[#37445B] dark:bg-[#1F2937] sm:px-6 sm:py-5 md:px-8">
        <View className="mb-6 w-full items-center justify-center">
          <Image
            source={require('@/assets/images/logo.png')}
            style={{
              width: 185,
              height: 68,
            }}
            resizeMode="contain"
            accessibilityLabel="Logo Tampets"
          />
        </View>

        <View className="w-full flex-row items-start">
          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#315B9A]">
              <Text className="text-sm font-bold text-white">1</Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#315B9A] dark:text-[#A9C7FF]">
              Instrução
            </Text>
          </View>

          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#315B9A]" />
          </View>

          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#315B9A]">
              <Text className="text-sm font-bold text-white">2</Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#315B9A] dark:text-[#A9C7FF]">
              Doação
            </Text>
          </View>

          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#D9E2F1] dark:bg-[#37445B]" />
          </View>

          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#D9E2F1] dark:bg-[#37445B]">
              <Text className="text-sm font-bold text-[#315B9A] dark:text-[#A9C7FF]">
                3
              </Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#566783] dark:text-[#B7C5DC]">
              Confirmação
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function DoacaoScreen() {
  const {
    pontoId: parametroPonto,
    nomeDoador: parametroNome,
  } = useLocalSearchParams<{
    pontoId?: string | string[];
    nomeDoador?: string | string[];
  }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const nomeDoador = (
    Array.isArray(parametroNome)
      ? parametroNome[0]
      : parametroNome
  )?.trim();

  const [ponto, setPonto] = useState<CollectionPoint | null>(null);
  const [carregandoPonto, setCarregandoPonto] = useState(true);
  const [erroPonto, setErroPonto] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [peso, setPeso] = useState(0);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [taraCapturada, setTaraCapturada] = useState(false);
  const [mostrarModalSemBalanca, setMostrarModalSemBalanca] = useState(false);
  const [mostrarModalSessaoAtiva, setMostrarModalSessaoAtiva] =
    useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const conexaoAtivaRef = useRef(false);
  const confirmandoRef = useRef(false);
  const taraRef = useRef<number | null>(null);
  const leiturasTaraRef = useRef<number[]>([]);
  const timeoutSemLeituraRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    let ativo = true;

    async function carregarPonto() {
      setCarregandoPonto(true);
      setErroPonto('');
      setPonto(null);

      const id = Number(pontoId);

      if (!pontoId || !Number.isInteger(id) || id <= 0) {
        setErroPonto('Identificação do ponto de coleta inválida.');
        setCarregandoPonto(false);
        return;
      }

      try {
        const resultado = await getCollectionPoint(id);

        if (ativo) {
          setPonto(resultado);
        }
      } catch (erroBusca) {
        console.error('[DOACAO] Erro ao buscar ponto:', erroBusca);

        if (ativo) {
          setErroPonto(
            'Não foi possível carregar os dados do ponto de coleta.'
          );
        }
      } finally {
        if (ativo) {
          setCarregandoPonto(false);
        }
      }
    }

    carregarPonto();

    return () => {
      ativo = false;
    };
  }, [pontoId]);

  function limparTimeoutSemLeitura() {
    if (timeoutSemLeituraRef.current !== null) {
      clearTimeout(timeoutSemLeituraRef.current);
      timeoutSemLeituraRef.current = null;
    }
  }

  function fecharWebSocket() {
    limparTimeoutSemLeitura();
    conexaoAtivaRef.current = false;

    const socket = socketRef.current;
    socketRef.current = null;

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN
      ) {
        socket.close();
      }
    }

    console.log('[WEBSOCKET] Conexão encerrada pelo aplicativo.');
  }

  function conectarWebSocket(idPonto: string) {
    fecharWebSocket();

    const url = `${WEBSOCKET_URL}/?pontoId=${encodeURIComponent(idPonto)}`;

    try {
      const socket = new WebSocket(url);

      socketRef.current = socket;
      conexaoAtivaRef.current = true;

      socket.onopen = () => {
        if (!conexaoAtivaRef.current || socketRef.current !== socket) {
          socket.close();
          return;
        }

        console.log('[WEBSOCKET] Conectado ao ponto:', idPonto);
        setErro('');
        setStatus('waiting');

        timeoutSemLeituraRef.current = setTimeout(() => {
          if (!conexaoAtivaRef.current || socketRef.current !== socket) {
            return;
          }

          console.warn(
            '[WEBSOCKET] Nenhuma leitura recebida para o ponto:',
            idPonto
          );

          fecharWebSocket();
          setStatus('idle');
          setTaraCapturada(false);
          setErro(
            'Não foi possível localizar a balança. Verifique se ela está ligada e conectada e tente novamente.'
          );
          setMostrarModalSemBalanca(true);
        }, TEMPO_LIMITE_BALANCA_MS);
      };

      socket.onmessage = (evento) => {
        if (!conexaoAtivaRef.current || socketRef.current !== socket) {
          return;
        }

        try {
          const leitura = JSON.parse(
            evento.data as string
          ) as MensagemWebSocket;

          if (leitura.tipo === 'sessao_iniciada') {
            console.log(
              '[WEBSOCKET] Sessão exclusiva garantida:',
              leitura.pontoId
            );
            return;
          }

          if (leitura.tipo === 'erro') {
            fecharWebSocket();
            setStatus('idle');

            if (leitura.codigo === 'SESSAO_ATIVA') {
              setErro(
                'Outra pessoa já iniciou uma pesagem neste ponto de coleta. Aguarde a finalização antes de tentar novamente.'
              );
              setMostrarModalSessaoAtiva(true);
            } else {
              setErro(
                leitura.mensagem ||
                  'Não foi possível iniciar a pesagem neste ponto.'
              );
            }

            return;
          }

          if (
            leitura.tipo !== 'leitura_peso' ||
            leitura.pontoId !== idPonto ||
            typeof leitura.peso !== 'number' ||
            !Number.isFinite(leitura.peso) ||
            leitura.peso < 0
          ) {
            console.warn('[WEBSOCKET] Mensagem inválida:', leitura);
            return;
          }

          limparTimeoutSemLeitura();

          const pesoBruto = leitura.peso;

          if (taraRef.current === null) {
            const leituras = [...leiturasTaraRef.current, pesoBruto].slice(-5);
            leiturasTaraRef.current = leituras;

            if (leituras.length < 5) {
              console.log(
                '[TARA] Aguardando estabilidade:',
                leituras.length,
                '/ 5'
              );
              return;
            }

            const menorPeso = Math.min(...leituras);
            const maiorPeso = Math.max(...leituras);
            const variacao = maiorPeso - menorPeso;

            if (variacao <= 0.005) {
              const taraCalculada =
                leituras.reduce((total, valor) => total + valor, 0) /
                leituras.length;

              taraRef.current = taraCalculada;
              setTaraCapturada(true);
              setErro('');

              console.log(
                '[TARA] Capturada com sucesso:',
                taraCalculada,
                'kg'
              );
            } else {
              console.log(
                '[TARA] Peso ainda instável. Variação:',
                variacao,
                'kg'
              );
            }

            return;
          }

          const pesoLiquido = Math.max(0, pesoBruto - taraRef.current);

          setPeso(pesoLiquido);
          setStatus(pesoLiquido > 0 ? 'ready' : 'waiting');
          setErro('');
        } catch (erroMensagem) {
          console.error(
            '[WEBSOCKET] Erro ao processar mensagem:',
            erroMensagem
          );
        }
      };

      socket.onerror = (evento) => {
        if (!conexaoAtivaRef.current || socketRef.current !== socket) {
          return;
        }

        console.error('[WEBSOCKET] Erro de conexão:', evento);
        fecharWebSocket();
        setStatus('idle');
        setErro('Erro na conexão com a balança em tempo real.');
      };

      socket.onclose = () => {
        if (!conexaoAtivaRef.current || socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;
        conexaoAtivaRef.current = false;
        limparTimeoutSemLeitura();
        setStatus('idle');

        console.log('[WEBSOCKET] Conexão encerrada inesperadamente.');
        setErro(
          'A conexão com a balança foi encerrada. Clique em "Iniciar pesagem" para tentar novamente.'
        );
      };
    } catch (erroConexao) {
      conexaoAtivaRef.current = false;
      setStatus('idle');

      console.error('[WEBSOCKET] Não foi possível conectar:', erroConexao);
      setErro('Não foi possível conectar à balança em tempo real.');
    }
  }

  useEffect(() => {
    return () => {
      fecharWebSocket();
    };
  }, []);

  function iniciarPesagem() {
    if (
      !pontoId ||
      !ponto ||
      carregandoPonto ||
      status !== 'idle'
    ) {
      return;
    }

    setErro('');
    setMostrarModalSemBalanca(false);
    setMostrarModalSessaoAtiva(false);
    setPeso(0);
    setTaraCapturada(false);

    taraRef.current = null;
    leiturasTaraRef.current = [];

    setStatus('waiting');

    console.log('[PESAGEM] Conectando ao WebSocket para:', pontoId);

    conectarWebSocket(pontoId);
  }

  async function confirmarDoacao() {
    if (
      !pontoId ||
      peso <= 0 ||
      status !== 'ready' ||
      taraRef.current === null ||
      confirmandoRef.current
    ) {
      return;
    }

    confirmandoRef.current = true;
    setConfirmando(true);
    setErro('');

    try {
      const pesoConfirmado = peso;

      await salvarDoacao(pontoId, pesoConfirmado);

      fecharWebSocket();

      const quantidadeConfirmada = Math.round(
        (pesoConfirmado * 1000) / 2
      );

      setPeso(pesoConfirmado);
      setStatus('finished');

      router.replace({
        pathname: '/sucesso-doacao',
        params: {
          pontoId,
          peso: String(pesoConfirmado),
          quantidadeTampinhas: String(quantidadeConfirmada),
          nomeDoador: nomeDoador || '',
        },
      });
    } catch (erroSalvar) {
      console.error('[DOACAO] Erro ao salvar:', erroSalvar);

      setErro(
        erroSalvar instanceof Error
          ? erroSalvar.message
          : 'Não foi possível salvar a doação. Tente novamente.'
      );
    } finally {
      confirmandoRef.current = false;
      setConfirmando(false);
    }
  }

  function voltarAoPonto() {
    setMostrarModalSemBalanca(false);
    setMostrarModalSessaoAtiva(false);
    fecharWebSocket();

    if (pontoId) {
      router.replace({
        pathname: '/ponto/[id]',
        params: {
          id: pontoId,
        },
      });
    } else {
      router.replace('/(tabs)');
    }
  }

  const endereco = ponto
    ? [
        `${ponto.address.street}, ${ponto.address.number}`,
        ponto.address.complement,
        ponto.address.district,
        ponto.address.city,
      ]
        .filter(Boolean)
        .join(' • ')
    : '';

  const enderecoCompleto = ponto
    ? `${endereco} - ${ponto.address.postCode}`
    : '';

  const textoStatus = !pontoId
    ? 'Ponto não identificado'
    : erro
      ? 'Ocorreu um erro'
      : status === 'idle'
        ? 'Pronto para iniciar'
        : status === 'waiting'
          ? taraCapturada
            ? 'Recipiente tarado. Adicione as tampinhas'
            : 'Tarando recipiente'
          : status === 'ready'
            ? 'Peso calculado'
            : 'Doação confirmada';

  const corStatus = erro
    ? 'bg-[#FCEBED] dark:bg-[#44272D]'
    : status === 'waiting'
      ? 'bg-[#FFF0CC] dark:bg-[#49391F]'
      : status === 'ready' || status === 'finished'
        ? 'bg-[#DCFCE7] dark:bg-[#173D2A]'
        : 'bg-[#E6EDFA] dark:bg-[#203955]';

  const corTextoStatus = erro
    ? 'text-[#A12B35] dark:text-[#FFB7BE]'
    : status === 'waiting'
      ? 'text-[#946400] dark:text-[#FFD477]'
      : status === 'ready' || status === 'finished'
        ? 'text-[#166534] dark:text-[#86EFAC]'
        : 'text-[#244A80] dark:text-[#A9C7FF]';

  const corIndicadorStatus = erro
    ? 'bg-[#DC2626]'
    : status === 'waiting'
      ? 'bg-[#D69E00]'
      : status === 'ready' || status === 'finished'
        ? 'bg-[#16A34A]'
        : 'bg-[#315B9A]';

  const tituloOrientacao = erro
    ? 'Não foi possível realizar a pesagem'
    : status === 'waiting'
      ? taraCapturada
        ? 'Agora adicione as tampinhas'
        : 'Coloque somente o recipiente vazio'
      : status === 'ready'
        ? 'Pesagem concluída'
        : status === 'finished'
          ? 'Doação confirmada'
          : 'Prepare o recipiente';

  const descricaoOrientacao = erro
    ? erro
    : status === 'waiting'
      ? taraCapturada
        ? 'O recipiente já foi tarado. Agora coloque as tampinhas dentro dele para registrar o peso da sua doação.'
        : 'Coloque apenas o recipiente vazio sobre a balança. Não adicione as tampinhas ainda. Aguarde a estabilização do peso para que a tara seja calculada corretamente.'
      : status === 'ready'
        ? 'O peso das tampinhas foi calculado. Confira o valor apresentado e confirme sua doação.'
        : status === 'finished'
          ? 'Sua doação foi registrada com sucesso.'
          : 'Antes de iniciar a pesagem, coloque somente o recipiente vazio sobre a balança. As tampinhas devem ser adicionadas somente depois que a tara for concluída.';

  const corFundoOrientacao = erro
    ? 'border-[#E9BFC4] bg-[#FCEBED] dark:border-[#74414A] dark:bg-[#44272D]'
    : status === 'waiting'
      ? 'border-[#E8C875] bg-[#FFF8E6] dark:border-[#795F2D] dark:bg-[#3D3421]'
      : status === 'ready' || status === 'finished'
        ? 'border-[#B8DFC2] bg-[#EAF7ED] dark:border-[#345D40] dark:bg-[#1C3525]'
        : 'border-[#C9DCF3] bg-[#EAF1FC] dark:border-[#2F4969] dark:bg-[#203955]';

  const corTituloOrientacao = erro
    ? 'text-[#A12B35] dark:text-[#FFB7BE]'
    : status === 'waiting'
      ? 'text-[#946400] dark:text-[#FFD477]'
      : status === 'ready' || status === 'finished'
        ? 'text-[#166534] dark:text-[#86EFAC]'
        : 'text-[#244A80] dark:text-[#A9C7FF]';

  const corDescricaoOrientacao = erro
    ? 'text-[#8F3038] dark:text-[#FFD0D4]'
    : status === 'waiting'
      ? 'text-[#765719] dark:text-[#F5DFA8]'
      : status === 'ready' || status === 'finished'
        ? 'text-[#245C35] dark:text-[#C1EACB]'
        : 'text-[#344F78] dark:text-[#C3D6F5]';

  return (
    <SafeAreaView className="flex-1 bg-[#F3F6FC] dark:bg-[#111827]">
      <ScrollView
        className="w-full flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full flex-grow px-2 pt-3 pb-8 sm:px-3 md:px-4"
      >
        <ProgressBar />

        <Text
          accessibilityRole="header"
          className="text-center text-[28px] font-extrabold text-[#202B45] dark:text-[#F1F5FF]"
        >
          Sua doação
        </Text>

        <Text className="mt-2 mb-6 text-center text-[15px] leading-[22px] text-[#485873] dark:text-[#C3CEE2]">
          Prepare suas tampinhas e acompanhe a pesagem em tempo real.
        </Text>

        {/* Ponto de coleta */}
        <View className="w-full rounded-[18px] border border-[#D9E2F1] bg-white p-5 dark:border-[#37445B] dark:bg-[#1F2937]">
          <Text className="text-[11px] font-extrabold tracking-[1.3px] text-[#315B9A] dark:text-[#A9C7FF]">
            PONTO DE COLETA
          </Text>

          {carregandoPonto ? (
            <View className="mt-4 flex-row items-center gap-3">
              <ActivityIndicator color="#315B9A" />

              <Text className="text-sm text-[#485873] dark:text-[#C3CEE2]">
                Carregando informações do ponto...
              </Text>
            </View>
          ) : erroPonto ? (
            <Text
              accessibilityRole="alert"
              className="mt-3 text-sm leading-5 text-[#A12B35] dark:text-[#FFB7BE]"
            >
              {erroPonto}
            </Text>
          ) : ponto ? (
            <>
              <Text
                accessibilityRole="header"
                className="mt-2 text-[21px] font-extrabold text-[#202B45] dark:text-[#F1F5FF]"
              >
                {ponto.name}
              </Text>

              <Text className="mt-2 text-sm leading-[21px] text-[#485873] dark:text-[#C3CEE2]">
                {enderecoCompleto}
              </Text>

              <View className="my-4 h-px bg-[#E2E8F2] dark:bg-[#37445B]" />

              <View className="gap-4">
                <View>
                  <Text className="text-[11px] font-bold tracking-wider text-[#566783] dark:text-[#B7C5DC]">
                    DIAS DE FUNCIONAMENTO
                  </Text>

                  <Text className="mt-1 text-sm font-semibold text-[#202B45] dark:text-[#F1F5FF]">
                    {ponto.opensDay}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold tracking-wider text-[#566783] dark:text-[#B7C5DC]">
                    HORÁRIO
                  </Text>

                  <Text className="mt-1 text-sm font-semibold text-[#202B45] dark:text-[#F1F5FF]">
                    {ponto.hourInit} às {ponto.hourFinal}
                  </Text>
                </View>
              </View>

              <Text className="mt-4 text-xs text-[#566783] dark:text-[#B7C5DC]">
                Código do ponto: {ponto.id}
              </Text>
            </>
          ) : (
            <Text className="mt-3 text-sm text-[#A12B35] dark:text-[#FFB7BE]">
              Ponto de coleta não encontrado.
            </Text>
          )}
        </View>

        {/* Área de pesagem */}
        <View className="mt-5 w-full items-center rounded-3xl bg-[#263B63] p-6">
          <Text className="text-xs font-bold tracking-[1.5px] text-[#D9E5FF]">
            PESO DA DOAÇÃO
          </Text>

          <Text
            accessibilityLabel={`Peso atual: ${peso.toFixed(3).replace('.', ',')} quilogramas`}
            accessibilityLiveRegion="polite"
            className="mt-3 text-[46px] font-extrabold text-white"
          >
            {peso.toFixed(3).replace('.', ',')}
          </Text>

          <Text className="-mt-1 text-base text-[#D9E5FF]">
            quilogramas
          </Text>

          <View
            accessibilityRole="summary"
            accessibilityLiveRegion="polite"
            className={`mt-5 flex-row items-center gap-2 rounded-full px-4 py-2 ${corStatus}`}
          >
            <View
              className={`h-2.5 w-2.5 rounded-full ${corIndicadorStatus}`}
            />

            <Text className={`text-xs font-bold ${corTextoStatus}`}>
              {textoStatus}
            </Text>
          </View>
        </View>

        {/* Orientações da pesagem */}
        <View
          accessibilityLiveRegion="polite"
          className={`mt-4 w-full rounded-2xl border p-5 ${corFundoOrientacao}`}
        >
          <View className="flex-row items-center gap-2">
            <View
              className={`h-2.5 w-2.5 rounded-full ${corIndicadorStatus}`}
            />

            <Text
              className={`flex-1 text-base font-extrabold ${corTituloOrientacao}`}
            >
              {tituloOrientacao}
            </Text>
          </View>

          <Text
            className={`mt-3 text-sm leading-[22px] ${corDescricaoOrientacao}`}
          >
            {descricaoOrientacao}
          </Text>
        </View>

        {/* Botão iniciar pesagem */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar pesagem da doação"
          accessibilityState={{
            disabled:
              status !== 'idle' ||
              !pontoId ||
              !ponto ||
              carregandoPonto,
          }}
          className={`mt-[22px] min-h-[54px] w-full items-center justify-center rounded-[14px] px-4 py-4 ${
            status !== 'idle' || !pontoId || !ponto || carregandoPonto
              ? 'bg-[#8297B8] opacity-70'
              : 'bg-[#315B9A] active:bg-[#254775]'
          }`}
          onPress={iniciarPesagem}
          disabled={
            status !== 'idle' ||
            !pontoId ||
            !ponto ||
            carregandoPonto
          }
        >
          <Text className="text-base font-bold text-white">
            Iniciar pesagem
          </Text>
        </Pressable>

        {/* Confirmar doação */}
        {status === 'ready' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar e registrar doação"
            accessibilityState={{
              disabled: confirmando,
              busy: confirmando,
            }}
            className={`mt-[22px] min-h-[54px] w-full flex-row items-center justify-center gap-3 rounded-[14px] px-4 py-4 ${
              confirmando
                ? 'bg-[#8297B8]'
                : 'bg-[#315B9A] active:bg-[#254775]'
            }`}
            onPress={confirmarDoacao}
            disabled={confirmando}
          >
            {confirmando && <ActivityIndicator color="#FFFFFF" />}

            <Text className="text-base font-bold text-white">
              {confirmando
                ? 'Salvando doação...'
                : 'Confirmar doação'}
            </Text>
          </Pressable>
        )}

        {/* Retorno ao ponto */}
        <Pressable
          className="mt-3 w-full items-center rounded-2xl border border-[#C9DCF3] bg-[#E4EFFC] px-6 py-4 dark:border-[#2F4969] dark:bg-[#203955]"
          accessibilityRole="button"
          accessibilityLabel="Voltar ao início"
          onPress={voltarAoPonto}
        >
          <Text className="text-sm font-bold text-[#24558F] dark:text-[#A9CCF5]">
            Voltar
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal: balança não encontrada */}
      <Modal
        visible={mostrarModalSemBalanca}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModalSemBalanca(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View
            accessibilityViewIsModal
            className="w-full max-w-[420px] rounded-3xl border border-[#E9BFC4] bg-[#FCEBED] p-6 dark:border-[#74414A] dark:bg-[#44272D]"
          >
            <Text className="text-center text-xl font-extrabold text-[#A12B35] dark:text-[#FFB7BE]">
              Balança não encontrada
            </Text>

            <Text className="mt-3 text-center text-sm leading-5 text-[#8F3038] dark:text-[#FFD0D4]">
              Não recebemos nenhuma leitura da balança. Verifique se ela está
              ligada e conectada ao sistema e tente novamente.
            </Text>

            <Pressable
              accessibilityRole="button"
              className="mt-6 min-h-[50px] items-center justify-center rounded-xl bg-[#B8323C] px-4 py-3"
              onPress={() => setMostrarModalSemBalanca(false)}
            >
              <Text className="font-bold text-white">
                Entendi
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal: sessão ativa */}
      <Modal
        visible={mostrarModalSessaoAtiva}
        transparent
        animationType="fade"
        onRequestClose={voltarAoPonto}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View
            accessibilityViewIsModal
            className="w-full max-w-[420px] rounded-3xl border border-[#F2C98A] bg-[#FFF4DE] p-6 dark:border-[#795426] dark:bg-[#3D3020]"
          >
            <Text className="text-center text-xl font-extrabold text-[#8A4B08] dark:text-[#FFD18A]">
              Pesagem já em andamento
            </Text>

            <Text className="mt-3 text-center text-sm leading-5 text-[#74400A] dark:text-[#FFE2B8]">
              Outra pessoa já iniciou uma pesagem neste ponto de coleta.
              Aguarde a finalização antes de tentar novamente.
            </Text>

            <Pressable
              accessibilityRole="button"
              className="mt-6 min-h-[50px] items-center justify-center rounded-xl bg-[#C56A12] px-4 py-3"
              onPress={voltarAoPonto}
            >
              <Text className="font-bold text-white">
                Voltar à página do ponto
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
