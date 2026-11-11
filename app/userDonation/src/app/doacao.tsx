import { useEffect, useRef, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import {
  ActivityIndicator,
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

type Status = 'idle' | 'waiting' | 'ready' | 'finished';

type LeituraWebSocket = {
  tipo: string;
  pontoId: string;
  peso: number;
  atualizadoEm?: string;
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

export default function DoacaoScreen() {
  const { pontoId: parametroPonto } =
    useLocalSearchParams<{ pontoId?: string | string[] }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const [ponto, setPonto] = useState<CollectionPoint | null>(null);
  const [carregandoPonto, setCarregandoPonto] = useState(true);
  const [erroPonto, setErroPonto] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [peso, setPeso] = useState(0);
  const [quantidade, setQuantidade] = useState(0);
  const [temLeitura, setTemLeitura] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [tara, setTara] = useState(0);
  const [taraCapturada, setTaraCapturada] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const conexaoAtivaRef = useRef(false);
  const confirmandoRef = useRef(false);
  const taraRef = useRef<number | null>(null);
  const leiturasTaraRef = useRef<number[]>([]);

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

  function fecharWebSocket() {
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

    const url =
      `${WEBSOCKET_URL}/?pontoId=${encodeURIComponent(idPonto)}`;

    try {
      const socket = new WebSocket(url);

      socketRef.current = socket;
      conexaoAtivaRef.current = true;

      socket.onopen = () => {
        if (
          !conexaoAtivaRef.current ||
          socketRef.current !== socket
        ) {
          socket.close();
          return;
        }

        console.log('[WEBSOCKET] Conectado ao ponto:', idPonto);

        setErro('');
        setStatus('waiting');
      };

      socket.onmessage = (evento) => {
        if (
          !conexaoAtivaRef.current ||
          socketRef.current !== socket
        ) {
          return;
        }

        try {
          const leitura = JSON.parse(
            evento.data as string
          ) as LeituraWebSocket;

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

          const pesoBruto = leitura.peso;

          // 1. Ainda não temos uma tara capturada.
          if (taraRef.current === null) {

            // Armazena as últimas cinco leituras.
            const leituras = [
              ...leiturasTaraRef.current,
              pesoBruto,
            ].slice(-5);

            leiturasTaraRef.current = leituras;

            // Precisamos de cinco leituras antes de avaliar.
            if (leituras.length < 5) {
              console.log(
                '[TARA] Aguardando estabilidade:',
                leituras.length,
                '/ 5'
              );

              return;
            }

            // Identifica a maior e a menor leitura.
            const menorPeso = Math.min(...leituras);
            const maiorPeso = Math.max(...leituras);

            const variacao = maiorPeso - menorPeso;

            // Aceita uma variação máxima de 5 gramas.
            if (variacao <= 0.005) {

              // Calcula a média das cinco leituras.
              const taraCalculada =
                leituras.reduce((total, valor) => total + valor, 0) /
                leituras.length;

              taraRef.current = taraCalculada;

              setTara(taraCalculada);
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

          // 2. Tara já capturada: calcula o peso líquido.
          const pesoLiquido = Math.max(
            0,
            pesoBruto - taraRef.current
          );

          // 3. Calcula a quantidade estimada de tampinhas.
          const quantidadeAtual = Math.round(
            (pesoLiquido * 1000) / 2
          );

          setPeso(pesoLiquido);
          setQuantidade(quantidadeAtual);
          setTemLeitura(true);

          // Só permite confirmar quando houver peso líquido.
          setStatus(pesoLiquido > 0 ? 'ready' : 'waiting');

          setErro('');

          console.log('[WEBSOCKET] Peso bruto:', pesoBruto, 'kg');
          console.log('[WEBSOCKET] Tara:', taraRef.current, 'kg');
          console.log('[WEBSOCKET] Peso líquido:', pesoLiquido, 'kg');
        } catch (erroMensagem) {
          console.error(
            '[WEBSOCKET] Erro ao processar mensagem:',
            erroMensagem
          );
        }
      };

      socket.onerror = (evento) => {
        if (
          !conexaoAtivaRef.current ||
          socketRef.current !== socket
        ) {
          return;
        }

        console.error('[WEBSOCKET] Erro de conexão:', evento);

        setErro('Erro na conexão com a balança em tempo real.');
      };

      socket.onclose = () => {
        if (socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;
        conexaoAtivaRef.current = false;

        console.log('[WEBSOCKET] Conexão perdida.');

        setErro(
          'A conexão com a balança foi encerrada. Volte e tente novamente.'
        );
      };
    } catch (erroConexao) {
      conexaoAtivaRef.current = false;

      console.error(
        '[WEBSOCKET] Não foi possível conectar:',
        erroConexao
      );

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

    setPeso(0);
    setQuantidade(0);
    setTemLeitura(false);

    // Reinicia a tara da nova doação.
    setTara(0);
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
      setQuantidade(quantidadeConfirmada);
      setStatus('finished');

      router.replace({
        pathname: '/sucesso-doacao',
        params: {
          pontoId,
          peso: String(pesoConfirmado),
          quantidadeTampinhas: String(quantidadeConfirmada),
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
    : status === 'idle'
      ? 'Pronto para iniciar'
      : status === 'waiting'
        ? taraCapturada
          ? 'Recipiente tarado. Adicione as tampinhas'
          : 'Estabilizando recipiente para tara'
        : status === 'ready'
          ? 'Peso recebido'
          : 'Doação confirmada';

  const corStatus =
    status === 'idle'
      ? 'bg-[#FFF0CC]'
      : status === 'waiting'
        ? 'bg-[#E6EDFA]'
        : status === 'ready'
          ? 'bg-[#DCE8FF]'
          : 'bg-[#E8E1FA]';

  const corTextoStatus =
    status === 'idle'
      ? 'text-[#704D00]'
      : status === 'waiting'
        ? 'text-[#244A80]'
        : status === 'ready'
          ? 'text-[#244A80]'
          : 'text-[#594080]';

  return (
    <SafeAreaView className="flex-1 bg-[#F3F6FC] dark:bg-[#111827]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow px-6 pt-6 pb-8"
      >
        {/* Cabeçalho */}
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
        <View className="rounded-[18px] border border-[#D9E2F1] bg-white p-5 dark:border-[#37445B] dark:bg-[#1F2937]">
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
        <View className="mt-5 items-center rounded-3xl bg-[#263B63] p-6 dark:bg-[#263B63]">
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

          {temLeitura && (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-[15px] font-bold text-white"
            >
              Aproximadamente {quantidade} tampinhas
            </Text>
          )}

          <View
            accessibilityRole="summary"
            accessibilityLiveRegion="polite"
            className={`mt-5 flex-row items-center gap-2 rounded-full px-4 py-2 ${corStatus}`}
          >
            <View
              className={`h-2.5 w-2.5 rounded-full ${status === 'idle'
                ? 'bg-[#946400]'
                : status === 'finished'
                  ? 'bg-[#594080]'
                  : 'bg-[#315B9A]'
                }`}
            />

            <Text className={`text-xs font-bold ${corTextoStatus}`}>
              {textoStatus}
            </Text>
          </View>
        </View>

        {/* Mensagens de erro */}
        {!!erro && (
          <View
            accessibilityRole="alert"
            className="mt-4 rounded-xl border border-[#E9BFC4] bg-[#FCEBED] p-4 dark:border-[#74414A] dark:bg-[#44272D]"
          >
            <Text className="text-center text-sm font-medium leading-5 text-[#A12B35] dark:text-[#FFB7BE]">
              {erro}
            </Text>
          </View>
        )}

        {/* Iniciar pesagem */}
        {status === 'idle' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar pesagem da doação"
            accessibilityState={{
              disabled: !pontoId || !ponto || carregandoPonto,
            }}
            className={`mt-[22px] min-h-[54px] items-center justify-center rounded-[14px] px-4 py-4 ${!pontoId || !ponto || carregandoPonto
              ? 'bg-[#8297B8]'
              : 'bg-[#315B9A] active:bg-[#254775]'
              }`}
            onPress={iniciarPesagem}
            disabled={!pontoId || !ponto || carregandoPonto}
          >
            <Text className="text-base font-bold text-white">
              {carregandoPonto
                ? 'Carregando ponto...'
                : 'Iniciar pesagem'}
            </Text>
          </Pressable>
        )}

        {/* Aguardando leitura */}
        {status === 'waiting' && (
          <View
            accessibilityLiveRegion="polite"
            className="mt-[22px] min-h-[54px] flex-row items-center justify-center gap-3 rounded-[14px] bg-[#DCE8F8] px-4 py-4 dark:bg-[#263B63]"
          >
            <ActivityIndicator color="#244A80" />

            <Text className="text-base font-bold text-[#244A80] dark:text-[#D9E5FF]">
              {taraCapturada
                ? 'Recipiente tarado. Adicione as tampinhas!'
                : 'Estabilizando recipiente...'}
            </Text>
          </View>
        )}

        {/* Confirmar doação */}
        {status === 'ready' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar e registrar doação"
            accessibilityState={{
              disabled: confirmando,
              busy: confirmando,
            }}
            className={`mt-[22px] min-h-[54px] flex-row items-center justify-center gap-3 rounded-[14px] px-4 py-4 ${confirmando
              ? 'bg-[#8297B8]'
              : 'bg-[#315B9A] active:bg-[#254775]'
              }`}
            onPress={confirmarDoacao}
            disabled={confirmando}
          >
            {confirmando && (
              <ActivityIndicator color="#FFFFFF" />
            )}

            <Text className="text-base font-bold text-white">
              {confirmando
                ? 'Salvando doação...'
                : 'Confirmar doação'}
            </Text>
          </Pressable>
        )}

        {/* Orientação */}
        <View className="mt-5 rounded-xl border border-[#D9E2F1] bg-[#E9EFF9] p-4 dark:border-[#37445B] dark:bg-[#1F2937]">
          <Text className="text-center text-xs leading-[19px] text-[#354966] dark:text-[#D0DBEE]">
            O peso é atualizado pela balança. A quantidade de
            tampinhas é uma estimativa baseada em 2 g por unidade.
            A doação só é registrada após a confirmação.
          </Text>
        </View>

        {/* Retorno ao ponto */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar aos detalhes do ponto de coleta"
          className="mt-4 min-h-[48px] items-center justify-center rounded-xl py-3"
          onPress={voltarAoPonto}
        >
          <Text className="text-sm font-bold text-[#315B9A] dark:text-[#A9C7FF]">
            Voltar ao ponto de coleta
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
