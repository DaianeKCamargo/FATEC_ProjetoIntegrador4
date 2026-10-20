
import { router, useLocalSearchParams } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collectionPoints } from '@/constants/collection-points';

export function generateStaticParams() {
  return [
    { id: 'PONTO-001' },
    { id: 'PONTO-002' },
  ];
}

const steps = [
  {
    number: '1',
    title: 'Separe as tampinhas',
    description:
      'Separe as tampinhas plásticas e retire resíduos ou sujeiras aparentes.',
    icon: '♻️',
  },
  {
    number: '2',
    title: 'Prepare a pesagem',
    description:
      'Coloque as tampinhas no recipiente indicado pelo responsável do ponto.',
    icon: '🧺',
  },
  {
    number: '3',
    title: 'Confira o peso',
    description:
      'Posicione o recipiente na balança e aguarde o valor estabilizar. Peça ajuda ao responsável se necessário.',
    icon: '⚖️',
  },
  {
    number: '4',
    title: 'Entregue sua doação',
    description:
      'Informe o peso ao responsável pelo ponto e deixe as tampinhas no local indicado para reciclagem.',
    icon: '🤝',
  },
];

export default function PontoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const pontoId = Array.isArray(id) ? id[0] : id;

  const ponto = collectionPoints.find(
    (item) => item.id.toUpperCase() === pontoId?.toUpperCase()
  );

  if (!ponto || ponto.status !== 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>📍</Text>
          <Text style={styles.title}>Ponto não encontrado</Text>
          <Text style={styles.description}>
            Confira o QR Code ou entre em contato com o responsável
            pelo ponto de coleta.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>TAMPETS ♻️</Text>
          <Text style={styles.eyebrow}>PONTO DE COLETA</Text>
          <Text style={styles.title}>{ponto.name}</Text>
          <Text style={styles.address}>{ponto.address}</Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ponto ativo</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Sua atitude transforma! 🌱
          </Text>
          <Text style={styles.welcomeText}>
            Veja como preparar e pesar suas tampinhas antes de
            entregá-las neste ponto de coleta.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Como fazer sua doação
        </Text>
        <Text style={styles.sectionDescription}>
          Siga as etapas abaixo para realizar o procedimento.
        </Text>

        {steps.map((step) => (
          <View key={step.number} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                {step.number}
              </Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
            </View>

            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>
        ))}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Antes de começar
          </Text>
          <Text style={styles.noticeText}>
            A pesagem deve seguir as orientações do responsável
            pelo local. Esta página é um tutorial: ela não mede
            o peso nem registra uma doação automaticamente.
          </Text>
        </View>

        <Pressable
            style={styles.donationButton}
            onPress={() =>
                router.push({
                pathname: '/doacao',
                params: { pontoId: ponto.id },
                })
            }
            >
            <Text style={styles.donationButtonText}>
                Iniciar doação
            </Text>
            <Text style={styles.donationButtonIcon}>→</Text>
        </Pressable>

        <Text style={styles.footer}>
        Tampets • Cada tampinha conta 💚
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FBF5',
    },
    donationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#168447',
        borderRadius: 16,
        paddingVertical: 17,
        paddingHorizontal: 20,
        marginTop: 24,
        gap: 10,
    },
    donationButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    donationButtonIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
  header: {
    backgroundColor: '#173D2B',
    borderRadius: 24,
    padding: 24,
  },
  brand: {
    color: '#BCE6C6',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 28,
  },
  eyebrow: {
    color: '#BCE6C6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 8,
  },
  address: {
    color: '#E0EDE3',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    backgroundColor: '#28543D',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 18,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8BD5A3',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#DFF2E3',
    padding: 20,
    borderRadius: 18,
    marginTop: 22,
  },
  welcomeTitle: {
    color: '#173D2B',
    fontSize: 19,
    fontWeight: '800',
  },
  welcomeText: {
    color: '#456451',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#173D2B',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 30,
  },
  sectionDescription: {
    color: '#5C7163',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE8DD',
    gap: 12,
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DFF2E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#168447',
    fontSize: 16,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#173D2B',
    fontSize: 15,
    fontWeight: '800',
  },
  stepDescription: {
    color: '#5C7163',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  stepIcon: {
    fontSize: 24,
  },
  notice: {
    backgroundColor: '#FFF5DD',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  noticeTitle: {
    color: '#77520A',
    fontSize: 15,
    fontWeight: '800',
  },
  noticeText: {
    color: '#775F2B',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  footer: {
    color: '#718174',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  notFoundIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  description: {
    color: '#5C7163',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
  },
});
