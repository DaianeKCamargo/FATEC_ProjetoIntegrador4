
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://fatec-balanca.vercel.app';
const WEBSOCKET_URL = 'wss://weight-websocket.onrender.com';

type Status = 'idle' | 'waiting' | 'ready' | 'finished';

type LeituraWebSocket = {
  tipo: string;
  pontoId: string;
  peso: number;
  atualizadoEm?: string;
};

async function iniciarSessao(pontoId: string) {
  const resposta = await fetch(
    `${API_URL}/pontos/${encodeURIComponent(pontoId)}/pesagem/iniciar`,
    { method: 'POST' }
  );

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(`Não foi possível iniciar a pesagem: ${texto}`);
  }
}

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

async function encerrarSessao(pontoId: string) {
  const resposta = await fetch(
    `${API_URL}/pontos/${encodeURIComponent(pontoId)}/pesagem/encerrar`,
    { method: 'POST' }
  );

  if (!resposta.ok) {
    throw new Error(
      `Falha ao encerrar a pesagem: HTTP ${resposta.status}`
    );
  }
}

export default function DoacaoScreen() {
  const { pontoId: parametroPonto } =
    useLocalSearchParams<{ pontoId?: string | string[] }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const [status, setStatus] = useState<Status>('idle');
  const [peso, setPeso] = useState(0);
  const [quantidade, setQuantidade] = useState(0);
  const [temLeitura, setTemLeitura] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const conexaoAtivaRef = useRef(false);
  const confirmandoRef = useRef(false);
  const sessaoIniciadaRef = useRef(false);

  function fecharWebSocket() {
    conexaoAtivaRef.current = false;

    const socket = socketRef.current;
    socketRef.current = null;

    if (socket) {
      // Evita executar manipuladores antigos durante o fechamento.
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

        console.log(
          '[WEBSOCKET] Conectado ao ponto:',
          idPonto
        );

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
            console.warn(
              '[WEBSOCKET] Mensagem inválida:',
              leitura
            );
            return;
          }

          const pesoAtual = leitura.peso;
          const quantidadeAtual = Math.round(
            (pesoAtual * 1000) / 2
          );

          setPeso(pesoAtual);
          setQuantidade(quantidadeAtual);
          setTemLeitura(true);
          setStatus(pesoAtual > 0 ? 'ready' : 'waiting');
          setErro('');

          console.log(
            '[WEBSOCKET] Peso recebido:',
            pesoAtual,
            'kg'
          );
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

        console.error(
          '[WEBSOCKET] Erro de conexão:',
          evento
        );

        setErro(
          'Erro na conexão com a balança em tempo real.'
        );
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

      setErro(
        'Não foi possível conectar à balança em tempo real.'
      );
    }
  }

  useEffect(() => {
    return () => {
      fecharWebSocket();
    };
  }, []);

  async function iniciarPesagem() {
    if (
      !pontoId ||
      status !== 'idle' ||
      sessaoIniciadaRef.current
    ) {
      return;
    }

    try {
      setErro('');
      setPeso(0);
      setQuantidade(0);
      setTemLeitura(false);

      console.log(
        '[PESAGEM] Iniciando sessão para:',
        pontoId
      );

      // Primeiro inicia a sessão na API existente.
      await iniciarSessao(pontoId);

      sessaoIniciadaRef.current = true;
      setStatus('waiting');

      // Depois abre a conexão em tempo real.
      conectarWebSocket(pontoId);
    } catch (erroInicio) {
      console.error(
        '[PESAGEM] Erro ao iniciar:',
        erroInicio
      );

      setErro(
        erroInicio instanceof Error
          ? erroInicio.message
          : 'Não foi possível iniciar a pesagem.'
      );

      setStatus('idle');
    }
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
      // Preserva o último peso recebido antes de fechar a conexão.
      const pesoConfirmado = peso;

      // Salva a doação. Se falhar, a conexão continua aberta.
      await salvarDoacao(pontoId, pesoConfirmado);

      // Após salvar com sucesso, fecha o WebSocket.
      fecharWebSocket();

      // Encerra a sessão na API da Vercel.
      try {
        await encerrarSessao(pontoId);
        sessaoIniciadaRef.current = false;
      } catch (erroEncerramento) {
        console.error(
          '[PESAGEM] A doação foi salva, mas houve erro ao encerrar a sessão:',
          erroEncerramento
        );
      }

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
          quantidadeTampinhas: String(
            quantidadeConfirmada
          ),
        },
      });
    } catch (erroSalvar) {
      console.error(
        '[DOACAO] Erro ao salvar:',
        erroSalvar
      );

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

  async function voltarAoLeitor() {
    // Fecha a conexão imediatamente ao sair da tela.
    fecharWebSocket();

    if (sessaoIniciadaRef.current && pontoId) {
      try {
        await encerrarSessao(pontoId);
        sessaoIniciadaRef.current = false;
      } catch (erroEncerramento) {
        console.error(
          '[PESAGEM] Erro ao encerrar sessão:',
          erroEncerramento
        );
      }
    }

    router.back();
  }

  const mostrarBotaoIniciar = status === 'idle';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Sua doação</Text>

        <Text style={styles.description}>
          Prepare suas tampinhas e acompanhe a pesagem.
        </Text>

        <View style={styles.pointCard}>
          <View style={styles.pointIcon}>
            <Text style={styles.iconText}>📍</Text>
          </View>

          <View style={styles.pointInfo}>
            <Text style={styles.label}>Ponto de coleta</Text>
            <Text style={styles.pointId}>
              {pontoId ?? 'Não identificado'}
            </Text>
            <Text style={styles.activeText}>
              Ponto selecionado
            </Text>
          </View>
        </View>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>
            PESO DA DOAÇÃO
          </Text>

          <Text style={styles.weightValue}>
            {peso.toFixed(3).replace('.', ',')}
          </Text>

          <Text style={styles.unit}>kg</Text>

          {temLeitura && (
            <Text style={styles.quantityText}>
              Aproximadamente {quantidade} tampinhas
            </Text>
          )}

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                status !== 'idle' && styles.waitingDot,
                status === 'ready' && styles.finishedDot,
              ]}
            />

            <Text style={styles.statusText}>
              {!pontoId
                ? 'Ponto não identificado'
                : status === 'idle'
                  ? 'Pronto para iniciar'
                  : status === 'waiting'
                    ? 'Aguardando leitura da balança...'
                    : status === 'ready'
                      ? 'Pesagem ao vivo'
                      : 'Doação confirmada'}
            </Text>
          </View>
        </View>

        {!!erro && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como funciona?</Text>

          <Text style={styles.infoText}>
            1. Toque em Iniciar pesagem.
          </Text>
          <Text style={styles.infoText}>
            2. Coloque as tampinhas na balança.
          </Text>
          <Text style={styles.infoText}>
            3. Acompanhe o peso e a quantidade estimada em tempo real.
          </Text>
          <Text style={styles.infoText}>
            4. Confira os valores e toque em Confirmar doação para salvar.
          </Text>
        </View>

        {mostrarBotaoIniciar && (
          <Pressable
            style={[
              styles.button,
              !pontoId && styles.buttonDisabled,
            ]}
            onPress={iniciarPesagem}
            disabled={!pontoId}
          >
            <Text style={styles.buttonText}>
              Iniciar pesagem
            </Text>
          </Pressable>
        )}

        {status === 'waiting' && (
          <View
            style={[styles.button, styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              Pesagem em andamento...
            </Text>
          </View>
        )}

        {status === 'ready' && (
          <Pressable
            style={[
              styles.confirmButton,
              confirmando && styles.buttonDisabled,
            ]}
            onPress={confirmarDoacao}
            disabled={confirmando}
          >
            <Text style={styles.buttonText}>
              {confirmando
                ? 'Salvando doação...'
                : 'Confirmar doação'}
            </Text>
          </Pressable>
        )}

        <Text style={styles.disclaimer}>
          O peso é atualizado pela balança. A quantidade de
          tampinhas é uma estimativa baseada em 2 g por unidade.
          A doação só é salva após a confirmação.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={voltarAoLeitor}
        >
          <Text style={styles.backButtonText}>
            Voltar ao leitor
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBF5',
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  title: {
    color: '#173D2B',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#5C7163',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE8DD',
    gap: 14,
  },
  pointIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6F4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  pointInfo: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: '#5C7163',
    fontSize: 13,
  },
  pointId: {
    color: '#173D2B',
    fontSize: 19,
    fontWeight: '800',
  },
  activeText: {
    color: '#168447',
    fontSize: 12,
    fontWeight: '600',
  },
  weightCard: {
    backgroundColor: '#173D2B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  weightLabel: {
    color: '#C8E6D0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  weightValue: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '800',
    marginTop: 14,
  },
  unit: {
    color: '#C8E6D0',
    fontSize: 16,
    marginTop: -2,
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#28543D',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0C36A',
  },
  waitingDot: {
    backgroundColor: '#8BD5A3',
  },
  finishedDot: {
    backgroundColor: '#8BD5A3',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCE8DD',
  },
  infoTitle: {
    color: '#173D2B',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoText: {
    color: '#5C7163',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#168447',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonDisabled: {
    backgroundColor: '#7CA98B',
  },
  confirmButton: {
    backgroundColor: '#173D2B',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#718174',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: '#FCEBE8',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    color: '#9B3026',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  backButtonText: {
    color: '#168447',
    fontSize: 14,
    fontWeight: '700',
  },
});
