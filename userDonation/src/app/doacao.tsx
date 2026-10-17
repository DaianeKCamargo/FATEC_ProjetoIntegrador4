
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DoacaoScreen() {
  const { pontoId } = useLocalSearchParams<{ pontoId: string }>();
  const [status, setStatus] = useState<
    'idle' | 'waiting' | 'finished'
  >('idle');

  function iniciarPesagem() {
    setStatus('waiting');

    setTimeout(() => {
      setStatus('finished');
    }, 2000);
  }

  function confirmarDoacao() {
  router.replace({
    pathname: '/sucesso-doacao',
    params: {
      pontoId: pontoId ?? 'Não identificado',
      peso: '0.75',
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
            {status === 'finished' ? '0,75' : '— —'}
          </Text>

          <Text style={styles.unit}>kg</Text>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                status === 'waiting' && styles.waitingDot,
              ]}
            />

            <Text style={styles.statusText}>
              {status === 'idle'
                ? 'Balança não conectada'
                : status === 'waiting'
                  ? 'Realizando pesagem...'
                  : 'Pesagem simulada concluída'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Como funciona?
          </Text>

          <Text style={styles.infoText}>
            1. Coloque as tampinhas na balança.
          </Text>

          <Text style={styles.infoText}>
            2. Inicie a pesagem pelo aplicativo.
          </Text>

          <Text style={styles.infoText}>
            3. Confira o peso registrado.
          </Text>
        </View>

        <Pressable
          style={[
            styles.button,
            status === 'waiting' && styles.buttonDisabled,
          ]}
          onPress={iniciarPesagem}
          disabled={status === 'waiting'}
        >
          <Text style={styles.buttonText}>
            {status === 'waiting'
              ? 'Realizando pesagem...'
              : status === 'finished'
                ? 'Pesar novamente'
                : 'Iniciar pesagem'}
          </Text>
        </Pressable>

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
          A pesagem real estará disponível após a
          integração com a balança.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
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
    marginTop: 12,
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
