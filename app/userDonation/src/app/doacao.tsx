
import { useEffect, useRef, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import {
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

  const socketRef = useRef<WebSocket | null>(null);
  const conexaoAtivaRef = useRef(false);
  const confirmandoRef = useRef(false);

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

          const pesoAtual = leitura.peso;
          const quantidadeAtual = Math.round((pesoAtual * 1000) / 2);

          setPeso(pesoAtual);
          setQuantidade(quantidadeAtual);
          setTemLeitura(true);
          setStatus(pesoAtual > 0 ? 'ready' : 'waiting');
          setErro('');

          console.log('[WEBSOCKET] Peso recebido:', pesoAtual, 'kg');
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
          'A conexão com a balança foi encerrada. Volte ao leitor e tente novamente.'
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
    setStatus('waiting');

    console.log('[PESAGEM] Conectando ao WebSocket para:', pontoId);

    conectarWebSocket(pontoId);
  }

  async function confirmarDoacao() {
    if (
      !pontoId ||
      peso <= 0 ||
      status !== 'ready' ||
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

  function voltarAoLeitor() {
    fecharWebSocket();
    router.back();
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

  return (
    <SafeAreaView className="flex-1 bg-[#F7FBF5]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow px-6 pt-6 pb-8"
      >
        <Text className="text-center text-[28px] font-extrabold text-[#173D2B]">
          Sua doação
        </Text>

        <Text className="mt-2 mb-6 text-center text-[15px] leading-[22px] text-[#5C7163]">
          Prepare suas tampinhas e acompanhe a pesagem em tempo real.
        </Text>

        {/* Ponto de coleta */}
        <View className="rounded-[18px] border border-[#DCE8DD] bg-white p-5">
          <Text className="text-[11px] font-extrabold tracking-[1.3px] text-[#168447]">
            PONTO DE COLETA
          </Text>

          {carregandoPonto ? (
            <Text className="mt-3 text-sm text-[#718174]">
              Carregando informações do ponto...
            </Text>
          ) : erroPonto ? (
            <Text className="mt-3 text-sm leading-5 text-[#9B3026]">
              {erroPonto}
            </Text>
          ) : ponto ? (
            <>
              <Text className="mt-2 text-[21px] font-extrabold text-[#173D2B]">
                {ponto.name}
              </Text>

              <Text className="mt-2 text-sm leading-[21px] text-[#5C7163]">
                {enderecoCompleto}
              </Text>

              <View className="my-4 h-px bg-[#E5ECE5]" />

              <View className="gap-4">
                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-[#718174]">
                    DIAS DE FUNCIONAMENTO
                  </Text>

                  <Text className="mt-1 text-sm font-semibold text-[#173D2B]">
                    {ponto.opensDay}
                  </Text>
                </View>

                <View>
                  <Text className="text-[10px] font-bold tracking-wider text-[#718174]">
                    HORÁRIO
                  </Text>

                  <Text className="mt-1 text-sm font-semibold text-[#173D2B]">
                    {ponto.hourInit} às {ponto.hourFinal}
                  </Text>
                </View>
              </View>

              <Text className="mt-4 text-[11px] text-[#8A998D]">
                Código do ponto: {ponto.id}
              </Text>
            </>
          ) : (
            <Text className="mt-3 text-sm text-[#9B3026]">
              Ponto de coleta não encontrado.
            </Text>
          )}
        </View>

        {/* Pesagem */}
        <View className="mt-5 items-center rounded-3xl bg-[#173D2B] p-6">
          <Text className="text-xs font-bold tracking-[1.5px] text-[#C8E6D0]">
            PESO DA DOAÇÃO
          </Text>

          <Text className="mt-3 text-[46px] font-extrabold text-white">
            {peso.toFixed(3).replace('.', ',')}
          </Text>

          <Text className="-mt-1 text-base text-[#C8E6D0]">
            kg
          </Text>

          {temLeitura && (
            <Text className="mt-3 text-[15px] font-bold text-white">
              Aproximadamente {quantidade} tampinhas
            </Text>
          )}

          <View className="mt-5 flex-row items-center gap-2 rounded-full bg-[#28543D] px-3 py-2">
            <View
              className={`h-2 w-2 rounded-full ${
                status === 'idle'
                  ? 'bg-[#F0C36A]'
                  : 'bg-[#8BD5A3]'
              }`}
            />

            <Text className="text-xs font-semibold text-white">
              {!pontoId
                ? 'Ponto não identificado'
                : status === 'idle'
                  ? 'Pronto para iniciar'
                  : status === 'waiting'
                    ? 'Aguardando leitura da balança...'
                    : status === 'ready'
                      ? 'Pesagem em andamento'
                      : 'Doação confirmada'}
            </Text>
          </View>
        </View>

        {/* Erros */}
        {!!erro && (
          <View className="mt-4 rounded-xl border border-[#F3D1CB] bg-[#FCEBE8] p-3">
            <Text className="text-center text-[13px] leading-[19px] text-[#9B3026]">
              {erro}
            </Text>
          </View>
        )}

        {/* Iniciar pesagem */}
        {status === 'idle' && (
          <Pressable
            className={`mt-[22px] items-center rounded-[14px] py-4 ${
              !pontoId || !ponto || carregandoPonto
                ? 'bg-[#7CA98B]'
                : 'bg-[#168447]'
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
          <View className="mt-[22px] items-center rounded-[14px] bg-[#7CA98B] py-4">
            <Text className="text-base font-bold text-white">
              Aguardando pesagem...
            </Text>
          </View>
        )}

        {/* Confirmar doação */}
        {status === 'ready' && (
          <Pressable
            className={`mt-[22px] items-center rounded-[14px] py-4 ${
              confirmando ? 'bg-[#7CA98B]' : 'bg-[#173D2B]'
            }`}
            onPress={confirmarDoacao}
            disabled={confirmando}
          >
            <Text className="text-base font-bold text-white">
              {confirmando
                ? 'Salvando doação...'
                : 'Confirmar doação'}
            </Text>
          </Pressable>
        )}

        <Text className="mt-3 text-center text-xs leading-[18px] text-[#718174]">
          O peso é atualizado pela balança. A quantidade de
          tampinhas é uma estimativa baseada em 2 g por unidade.
          A doação só é registrada após a confirmação.
        </Text>

        <Pressable
          className="mt-1 items-center py-4"
          onPress={voltarAoLeitor}
        >
          <Text className="text-sm font-bold text-[#168447]">
            Voltar ao leitor
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
