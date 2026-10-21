
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

type Doacao = {
  id: number | string;
  peso: number | string;
  quantidadeTampinhas: number | string;
  pontoId?: string | null;
  createdAt?: string;
};

async function buscarUltimaDoacao(
  pontoId: string
): Promise<Doacao | null> {
  const resposta = await fetch(
    `${API_URL}/pontos/${encodeURIComponent(pontoId)}/ultima-doacao`
  );

  // O ponto ainda pode não ter nenhuma doação registrada.
  if (resposta.status === 404) {
    return null;
  }

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}`);
  }

  return (await resposta.json()) as Doacao;
}

export default function DoacaoScreen() {
  const { pontoId: parametroPonto } =
    useLocalSearchParams<{ pontoId?: string }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const [status, setStatus] = useState<
    'idle' | 'waiting' | 'finished'
  >('idle');

  const [peso, setPeso] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [baselineLoaded, setBaselineLoaded] = useState(false);
  const [erro, setErro] = useState('');

  // Guarda o ID da última doação existente antes de iniciar a espera.
  const ultimoIdRef = useRef<string | null>(null);
  const pollingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ao abrir a tela, registra qual era a última doação do ponto.
  useEffect(() => {
    let ativo = true;

    async function carregarReferencia() {
      if (!pontoId) {
        setErro('Ponto de coleta não identificado. Volte ao leitor de QR Code.');
        return;
      }

      try {
        const doacao = await buscarUltimaDoacao(pontoId);

        if (!ativo) return;

        ultimoIdRef.current = doacao ? String(doacao.id) : null;
        setBaselineLoaded(true);
        setErro('');
      } catch {
        if (!ativo) return;

        setErro(
          'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'
        );
      }
    }

    carregarReferencia();

    return () => {
      ativo = false;
      pollingRef.current = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pontoId]);

  async function iniciarPesagem() {
    if (!pontoId || status === 'waiting') return;

    setErro('');

    // Se a consulta inicial falhou, tenta novamente antes de esperar.
    if (!baselineLoaded) {
      try {
        const doacao = await buscarUltimaDoacao(pontoId);

        ultimoIdRef.current = doacao ? String(doacao.id) : null;
        setBaselineLoaded(true);
      } catch {
        setErro(
          'Não foi possível consultar a API. Verifique a conexão e tente novamente.'
        );
        return;
      }
    }

    setPeso(null);
    setQuantidade(null);
    setStatus('waiting');
    pollingRef.current = true;

    async function consultarNovaDoacao() {
      if (!pollingRef.current) return;

      try {
        const doacao = await buscarUltimaDoacao(pontoId);

        if (!pollingRef.current) return;

        // Só aceita um registro diferente do que existia antes.
        if (
          doacao &&
          String(doacao.id) !== ultimoIdRef.current
        ) {
          const pesoRecebido = Number(doacao.peso);
          const quantidadeRecebida = Number(
            doacao.quantidadeTampinhas
          );

          if (
            !Number.isFinite(pesoRecebido) ||
            pesoRecebido <= 0 ||
            !Number.isFinite(quantidadeRecebida)
          ) {
            throw new Error('Dados da doação inválidos.');
          }

          ultimoIdRef.current = String(doacao.id);
          setPeso(pesoRecebido);
          setQuantidade(quantidadeRecebida);
          setErro('');
          setStatus('finished');
          pollingRef.current = false;
          return;
        }

        setErro('');
      } catch {
        if (pollingRef.current) {
          setErro(
            'Falha temporária ao consultar a API. Tentando novamente...'
          );
        }
      }

      if (pollingRef.current) {
        timerRef.current = setTimeout(
          consultarNovaDoacao,
          2000
        );
      }
    }

    consultarNovaDoacao();
  }

  function confirmarDoacao() {
    if (peso === null || quantidade === null) return;

    router.replace({
      pathname: '/sucesso-doacao',
      params: {
        pontoId: pontoId ?? 'Não identificado',
        peso: String(peso),
        quantidadeTampinhas: String(quantidade),
      },
    });
  }

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
            {status === 'finished' && peso !== null
              ? peso.toFixed(2).replace('.', ',')
              : '— —'}
          </Text>

          <Text style={styles.unit}>kg</Text>

          {status === 'finished' && quantidade !== null && (
            <Text style={styles.quantityText}>
              Aproximadamente {quantidade} tampinhas
            </Text>
          )}

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                status === 'waiting' && styles.waitingDot,
                status === 'finished' && styles.finishedDot,
              ]}
            />

            <Text style={styles.statusText}>
              {!pontoId
                ? 'Ponto não identificado'
                : status === 'waiting'
                  ? 'Aguardando doação da balança...'
                  : status === 'finished'
                    ? 'Doação recebida com sucesso'
                    : baselineLoaded
                      ? 'Conectado à API'
                      : 'Conectando à API...'}
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
            1. Coloque as tampinhas na balança.
          </Text>
          <Text style={styles.infoText}>
            2. Inicie a espera pelo aplicativo.
          </Text>
          <Text style={styles.infoText}>
            3. Aguarde o registro da balança na API.
          </Text>
          <Text style={styles.infoText}>
            4. Confira o peso e a quantidade estimada.
          </Text>
        </View>

        {status !== 'finished' && (
          <Pressable
            style={[
              styles.button,
              status === 'waiting' && styles.buttonDisabled,
              !pontoId && styles.buttonDisabled,
            ]}
            onPress={iniciarPesagem}
            disabled={status === 'waiting' || !pontoId}
          >
            <Text style={styles.buttonText}>
              {status === 'waiting'
                ? 'Aguardando doação...'
                : 'Iniciar pesagem'}
            </Text>
          </Pressable>
        )}

        {status === 'finished' && (
          <Pressable
            style={styles.confirmButton}
            onPress={confirmarDoacao}
          >
            <Text style={styles.buttonText}>
              Confirmar doação
            </Text>
          </Pressable>
        )}

        <Text style={styles.disclaimer}>
          O peso e a quantidade são obtidos da API após o
          registro da balança. A quantidade de tampinhas é uma
          estimativa baseada em 2 g por unidade.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => {
            pollingRef.current = false;

            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }

            router.back();
          }}
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
