
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

type Status = 'idle' | 'waiting' | 'ready' | 'finished';

type LeituraAtual = {
  pontoId: string;
  conectado: boolean;
  peso: number | null;
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

async function buscarLeituraAtual(
  pontoId: string
): Promise<LeituraAtual> {
  const resposta = await fetch(
    `${API_URL}/pontos/${encodeURIComponent(pontoId)}/pesagem/atual`
  );

  const texto = await resposta.text();

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}: ${texto}`);
  }

  return JSON.parse(texto) as LeituraAtual;
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
    throw new Error(`Falha ao encerrar a pesagem: HTTP ${resposta.status}`);
  }
}

export default function DoacaoScreen() {
  const { pontoId: parametroPonto } =
    useLocalSearchParams<{ pontoId?: string | string[] }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const [status, setStatus] = useState<Status>('idle');
  const [peso, setPeso] = useState<number>(0);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [temLeitura, setTemLeitura] = useState(false);
  const [erro, setErro] = useState('');

  const pollingRef = useRef(false);
  const confirmandoRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessaoIniciadaRef = useRef(false);

  function pararConsulta() {
    pollingRef.current = false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      pararConsulta();
    };
  }, []);

  async function consultarPeso() {
    if (!pollingRef.current || !pontoId) return;

    try {
      const leitura = await buscarLeituraAtual(pontoId);

      if (!pollingRef.current) return;

      if (
        leitura.conectado &&
        leitura.peso !== null &&
        Number.isFinite(Number(leitura.peso)) &&
        Number(leitura.peso) >= 0
      ) {
        const pesoAtual = Number(leitura.peso);
        const quantidadeAtual = Math.round((pesoAtual * 1000) / 2);

        setPeso(pesoAtual);
        setQuantidade(quantidadeAtual);
        setTemLeitura(true);
        setStatus(pesoAtual > 0 ? 'ready' : 'waiting');
        setErro('');
      } else {
        setTemLeitura(false);
        setPeso(0);
        setQuantidade(0);
        setStatus('waiting');
        setErro('');
      }
    } catch (erroConsulta) {
      if (!pollingRef.current) return;

      console.error('[PESAGEM] Erro ao consultar:', erroConsulta);
      setErro('Não foi possível consultar a API. Tentando novamente...');;
    }

    if (pollingRef.current) {
      timerRef.current = setTimeout(consultarPeso, 1000);
    }
  }

  async function iniciarPesagem() {
    if (!pontoId || status !== 'idle') return;

    try {
      setErro('');
      setPeso(0);
      setQuantidade(0);
      setTemLeitura(false);

      console.log('[PESAGEM] Iniciando sessão para:', pontoId);

      await iniciarSessao(pontoId);

      sessaoIniciadaRef.current = true;
      pollingRef.current = true;
      setStatus('waiting');

      consultarPeso();
    } catch (erroInicio) {
      console.error('[PESAGEM] Erro ao iniciar:', erroInicio);
      setErro(
        erroInicio instanceof Error
          ? erroInicio.message
          : 'Não foi possível iniciar a pesagem.'
      );
    }
  }

  async function confirmarDoacao() {
    if (
      !pontoId ||
      peso === null ||
      peso <= 0 ||
      status !== 'ready' ||
      confirmandoRef.current
    ) {
      return;
    }

    confirmandoRef.current = true;
    setErro('');

    try {
      // Salva somente quando a pessoa confirma.
      const pesoConfirmado = peso;

      await salvarDoacao(pontoId, pesoConfirmado);

      pararConsulta();

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
    }
  }

  async function voltarAoLeitor() {
    pararConsulta();

    if (sessaoIniciadaRef.current && pontoId) {
      try {
        await encerrarSessao(pontoId);
        sessaoIniciadaRef.current = false;
      } catch (erroEncerramento) {
        console.error('[PESAGEM] Erro ao encerrar sessão:', erroEncerramento);
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
            <Text style={styles.activeText}>Ponto selecionado</Text>
          </View>
        </View>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>PESO DA DOAÇÃO</Text>

          <Text style={styles.weightValue}>
            {peso.toFixed(3).replace('.', ',')}
          </Text>

          <Text style={styles.unit}>kg</Text>

          {temLeitura && quantidade !== null && (
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
            <Text style={styles.buttonText}>Iniciar pesagem</Text>
          </Pressable>
        )}

        {status === 'waiting' && (
          <View style={[styles.button, styles.buttonDisabled]}>
            <Text style={styles.buttonText}>Pesagem em andamento...</Text>
          </View>
        )}

        {status === 'ready' && (
          <Pressable
            style={styles.confirmButton}
            onPress={confirmarDoacao}
            disabled={confirmandoRef.current}
          >
            <Text style={styles.buttonText}>
              Confirmar doação
            </Text>
          </Pressable>
        )}

        <Text style={styles.disclaimer}>
          O peso é atualizado pela balança. A quantidade de tampinhas é
          uma estimativa baseada em 2 g por unidade. A doação só é salva
          após a confirmação.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={voltarAoLeitor}
        >
          <Text style={styles.backButtonText}>Voltar ao leitor</Text>
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
