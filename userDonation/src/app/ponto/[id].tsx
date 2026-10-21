import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
    (item) => item.id.toUpperCase() === pontoId?.toUpperCase(),
  );

  if (!ponto || ponto.status !== 'active') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center px-7">
          <View className="mb-5 h-[84px] w-[84px] items-center justify-center rounded-full border border-[rgba(95,129,183,0.15)] bg-[#EDF6FF]">
            <Text className="text-[42px]">📍</Text>
          </View>

          <Text className="text-center text-[25px] font-extrabold text-[#1F2B3D]">
            Ponto não encontrado
          </Text>

          <Text className="mt-3 text-center text-[15px] leading-[23px] text-[#4F5D72]">
            Confira o QR Code ou entre em contato com o responsável pelo ponto
            de coleta.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-9 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho do ponto */}
        <View className="rounded-[28px] border border-[rgba(95,129,183,0.12)] bg-[#2C4D7D] p-6 shadow-[0px_14px_30px_rgba(80,80,80,0.10)]">
          <View className="mb-7 flex-row items-center justify-between">
            <Text className="text-[15px] font-extrabold text-[#D9E9FF]">
              TAMPETS ♻️
            </Text>

            <View className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              <Text className="text-[10px] font-bold tracking-[1.5px] text-white">
                DOAÇÃO
              </Text>
            </View>
          </View>

          <Text className="text-[11px] font-bold tracking-[1.8px] text-[#D9E9FF]">
            PONTO DE COLETA
          </Text>

          <Text className="mt-2 text-[27px] font-extrabold leading-[33px] text-white">
            {ponto.name}
          </Text>

          <Text className="mt-2.5 text-[14px] leading-[21px] text-[#E0EAF8]">
            {ponto.address}
          </Text>

          <View className="mt-[18px] flex-row items-center gap-[7px] self-start rounded-full border border-white/10 bg-white/10 px-3 py-2">
            <View className="h-2 w-2 rounded-full bg-[#8BD5A3]" />
            <Text className="text-xs font-bold text-white">Ponto ativo</Text>
          </View>
        </View>

        {/* Mensagem de boas-vindas */}
        <View className="mt-[22px] rounded-[22px] border border-[rgba(95,129,183,0.14)] bg-[#EDF6FF] p-5">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-white/80">
            <Text className="text-[25px]">🌱</Text>
          </View>

          <Text className="text-[19px] font-extrabold text-[#1F2B3D]">
            Sua atitude transforma!
          </Text>

          <Text className="mt-2 text-[14px] leading-[22px] text-[#4F5D72]">
            Veja como preparar e pesar suas tampinhas antes de entregá-las
            neste ponto de coleta.
          </Text>
        </View>

        {/* Introdução das etapas */}
        <View className="mt-7">
          <Text className="text-[23px] font-extrabold text-[#1F2B3D]">
            Como fazer sua doação
          </Text>

          <Text className="mt-[7px] text-[14px] leading-[21px] text-[#4F5D72]">
            Siga as etapas abaixo para realizar o procedimento.
          </Text>
        </View>

        {/* Etapas */}
        <View className="mt-4 gap-3">
          {steps.map((step) => (
            <View
              key={step.number}
              className="flex-row items-start gap-3 rounded-[20px] border border-[rgba(95,129,183,0.16)] bg-white p-4 shadow-[0px_8px_18px_rgba(80,80,80,0.05)]"
            >
              <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#EDF6FF]">
                <Text className="text-[16px] font-extrabold text-[#2C4D7D]">
                  {step.number}
                </Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-extrabold text-[#1F2B3D]">
                  {step.title}
                </Text>

                <Text className="mt-1.5 text-[13px] leading-5 text-[#4F5D72]">
                  {step.description}
                </Text>
              </View>

              <Text className="ml-1 text-[23px]">{step.icon}</Text>
            </View>
          ))}
        </View>

        {/* Aviso */}
        <View className="mt-4 rounded-[20px] border border-[rgba(218,190,37,0.28)] bg-[#FFF9E8] p-[18px]">
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-[20px]">💡</Text>
            <Text className="text-[15px] font-extrabold text-[#77520A]">
              Antes de começar
            </Text>
          </View>

          <Text className="text-[13px] leading-5 text-[#775F2B]">
            A pesagem deve seguir as orientações do responsável pelo local.
            Esta página é um tutorial: ela não mede o peso nem registra uma
            doação automaticamente.
          </Text>
        </View>

        {/* Botão para iniciar a doação */}
        <Pressable
          className="mt-6 min-h-[58px] flex-row items-center justify-center gap-2.5 rounded-[18px] bg-[#2C4D7D] px-5 py-[17px] shadow-[0px_10px_22px_rgba(44,77,125,0.20)] active:opacity-80"
          onPress={() =>
            router.push({
              pathname: '/doacao',
              params: { pontoId: ponto.id },
            })
          }
        >
          <Text className="text-[16px] font-extrabold text-white">
            Iniciar doação
          </Text>
          <Text className="text-[20px] font-extrabold text-white">→</Text>
        </Pressable>

        {/* Rodapé */}
        <Text className="mt-7 text-center text-[12px] text-[#718096]">
          Tampets • Cada tampinha conta 💚
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}