
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SucessoDoacaoScreen() {
  const { pontoId, peso } = useLocalSearchParams<{
    pontoId: string;
    peso: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>
          Doação confirmada!
        </Text>

        <Text style={styles.description}>
          Obrigado por fazer parte dessa mudança.
          Cada tampinha conta para um futuro melhor!
        </Text>

        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>
            PESO DA DOAÇÃO
          </Text>

          <Text style={styles.weightValue}>
            {(peso ?? '0.75').replace('.', ',')} kg
          </Text>

          <View style={styles.divider} />

          <Text style={styles.pointLabel}>
            PONTO DE COLETA
          </Text>

          <Text style={styles.pointValue}>
            📍 {pontoId ?? 'Não identificado'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Você fez a diferença! 🌱
          </Text>

          <Text style={styles.infoText}>
            Sua contribuição ajuda a incentivar a
            reciclagem e o descarte correto de tampinhas.
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>
            Voltar ao início
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Registro demonstrativo. A doação ainda não foi
          salva no banco de dados.
        </Text>
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DDF3E2',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  check: {
    color: '#168447',
    fontSize: 56,
    fontWeight: '800',
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
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  weightCard: {
    backgroundColor: '#173D2B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  weightLabel: {
    color: '#C8E6D0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  weightValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#426650',
    marginVertical: 22,
  },
  pointLabel: {
    color: '#C8E6D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pointValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8DD',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
  },
  infoTitle: {
    color: '#173D2B',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    color: '#5C7163',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#168447',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#718174',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
  },
});
