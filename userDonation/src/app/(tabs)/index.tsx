
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#121A16' : '#F7FBF5',
    surface: isDark ? '#202C25' : '#FFFFFF',
    text: isDark ? '#F1F8F2' : '#173D2B',
    secondary: isDark ? '#B9CDBF' : '#5C7163',
    green: isDark ? '#70D995' : '#168447',
    greenDark: isDark ? '#173D29' : '#E0F5E5',
    blue: isDark ? '#203D50' : '#DDF2FF',
    yellow: isDark ? '#494024' : '#FFF1C9',
    pink: isDark ? '#492B38' : '#FFE2E8',
    border: isDark ? '#34443A' : '#E2EDE2',
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: colors.greenDark },
            ]}
          >
            <Text style={styles.logoEmoji}>♻️</Text>
          </View>

          <Text style={[styles.appName, { color: colors.text }]}>
            Doe suas{'\n'}Tampinhas
          </Text>

          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Pequenas atitudes,{'\n'}grandes transformações!
          </Text>
        </View>

        {/* Ilustração */}
        <View
          style={[
            styles.illustration,
            { backgroundColor: colors.greenDark },
          ]}
        >
          <View style={styles.capRow}>
            <View style={[styles.cap, { backgroundColor: '#2389E8' }]}>
              <Text style={styles.capText}>●</Text>
            </View>

            <View style={[styles.cap, { backgroundColor: '#F05252' }]}>
              <Text style={styles.capText}>●</Text>
            </View>

            <View style={[styles.cap, { backgroundColor: '#F5BD32' }]}>
              <Text style={styles.capText}>●</Text>
            </View>

            <View style={[styles.cap, { backgroundColor: '#36AC69' }]}>
              <Text style={styles.capText}>●</Text>
            </View>
          </View>

          <Text style={styles.jarEmoji}>🫙</Text>

          <View
            style={[
              styles.illustrationLabel,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.illustrationText, { color: colors.green }]}>
              Cada tampinha conta!
            </Text>
          </View>

          <Text style={styles.leafEmoji}>🌱</Text>
        </View>

        {/* Apresentação */}
        <View style={styles.intro}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vamos fazer a diferença?
          </Text>

          <Text style={[styles.description, { color: colors.secondary }]}>
            Suas tampinhas podem ajudar a preservar o meio ambiente
            e contribuir para projetos sociais. Separe suas tampinhas
            e venha fazer parte dessa iniciativa!
          </Text>
        </View>

        {/* Benefícios */}
        <View style={styles.benefits}>
          <View
            style={[
              styles.benefitCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.greenDark }]}>
              <Text style={styles.benefitEmoji}>🌿</Text>
            </View>
            <Text style={[styles.benefitTitle, { color: colors.text }]}>
              Cuide do planeta
            </Text>
          </View>

          <View
            style={[
              styles.benefitCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.yellow }]}>
              <Text style={styles.benefitEmoji}>🤝</Text>
            </View>
            <Text style={[styles.benefitTitle, { color: colors.text }]}>
              Apoie boas causas
            </Text>
          </View>

          <View
            style={[
              styles.benefitCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.pink }]}>
              <Text style={styles.benefitEmoji}>💚</Text>
            </View>
            <Text style={[styles.benefitTitle, { color: colors.text }]}>
              Faça a diferença
            </Text>
          </View>
        </View>

        {/* Orientação para uso do QR Code */}
        <View
          style={[
            styles.donateButton,
            {
              backgroundColor: colors.greenDark,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.buttonEmoji}>📱</Text>
          <Text style={[styles.instructionText, { color: colors.text }]}>
            Para doar, escaneie o QR Code do ponto de coleta
          </Text>
        </View>

        <Text style={[styles.footerText, { color: colors.secondary }]}>
          Consulte as orientações de coleta diretamente pelo navegador.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 37,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
  },
  illustration: {
    minHeight: 210,
    marginTop: 26,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    overflow: 'hidden',
  },
  capRow: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  cap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  capText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  jarEmoji: {
    fontSize: 88,
    marginTop: -2,
  },
  illustrationLabel: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  illustrationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  leafEmoji: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    fontSize: 34,
  },
  intro: {
    marginTop: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  benefits: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  benefitCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitEmoji: {
    fontSize: 25,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 9,
    lineHeight: 17,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
  },
  buttonEmoji: {
    fontSize: 22,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 14,
  },
});
