import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BenefitCardProps = {
  emoji: string;
  title: string;
  iconBackground: string;
};

function BenefitCard({
  emoji,
  title,
  iconBackground,
}: BenefitCardProps) {
  return (
    <View className="min-w-0 flex-1 items-center rounded-[18px] border border-[rgba(95,129,183,0.18)] bg-white/[0.92] px-1 py-3.5 shadow-[0px_8px_18px_rgba(80,80,80,0.06)] dark:border-[#34463A] dark:bg-[#1C2921] dark:shadow-none">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${iconBackground}`}
      >
        <Text className="text-[25px]">{emoji}</Text>
      </View>

      <Text className="mt-[9px] text-center text-xs font-bold leading-[17px] text-[#1F2B3D] dark:text-[#F0F5F1]">
        {title}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#101A14]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View className="items-center gap-[10px]">
          <View className="h-[76px] w-[76px] items-center justify-center rounded-full border border-[rgba(95,129,183,0.12)] bg-[#EDF6FF] shadow-[0px_10px_22px_rgba(95,129,183,0.15)] dark:border-[#344B3B] dark:bg-[#263B2E] dark:shadow-none">
            <Text className="text-[42px]">♻️</Text>
          </View>

          <Text className="text-center text-[32px] font-extrabold leading-[37px] text-[#1F2B3D] dark:text-[#F0F5F1]">
            Doe suas{'\n'}Tampinhas
          </Text>

          <Text className="text-center text-base leading-[23px] text-[#4F5D72] dark:text-[#C0CEC3]">
            Pequenas atitudes,{'\n'}grandes transformações!
          </Text>
        </View>

        {/* Ilustração */}
        <View className="relative mt-[26px] min-h-[210px] items-center justify-center overflow-hidden rounded-[28px] border border-[rgba(95,129,183,0.12)] bg-[#EDF6FF] p-[18px] shadow-[0px_14px_30px_rgba(80,80,80,0.08)] dark:border-[#344B3B] dark:bg-[#1D3024] dark:shadow-none">
          <View className="z-10 flex-row gap-3">
            <View className="h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-white bg-[#2389E8]">
              <Text className="text-[17px] text-white">●</Text>
            </View>

            <View className="h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-white bg-[#F05252]">
              <Text className="text-[17px] text-white">●</Text>
            </View>

            <View className="h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-white bg-[#F5BD32]">
              <Text className="text-[17px] text-white">●</Text>
            </View>

            <View className="h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-white bg-[#36AC69]">
              <Text className="text-[17px] text-white">●</Text>
            </View>
          </View>

          <Text className="-mt-0.5 text-[88px]">🫙</Text>

          <View className="rounded-full border border-[rgba(95,129,183,0.12)] bg-white/[0.92] px-[18px] py-[9px] shadow-[0px_8px_18px_rgba(80,80,80,0.06)] dark:border-[#526B58] dark:bg-[#293D2F] dark:shadow-none">
            <Text className="text-[15px] font-bold text-[#2C4D7D] dark:text-[#E0F2E4]">
              Cada tampinha conta!
            </Text>
          </View>

          <Text className="absolute bottom-3 right-4 text-[34px]">
            🌱
          </Text>
        </View>

        {/* Introdução */}
        <View className="mt-7 gap-[10px]">
          <Text className="text-center text-[23px] font-extrabold text-[#1F2B3D] dark:text-[#F0F5F1]">
            Vamos fazer a diferença?
          </Text>

          <Text className="text-center text-[15px] leading-[23px] text-[#4F5D72] dark:text-[#C0CEC3]">
            Suas tampinhas podem ajudar a preservar o meio
            ambiente e contribuir para projetos sociais.
            Separe suas tampinhas e venha fazer parte
            dessa iniciativa!
          </Text>
        </View>

        {/* Benefícios */}
        <View className="mt-6 flex-row gap-[10px]">
          <BenefitCard
            emoji="🌿"
            title="Cuide do planeta"
            iconBackground="bg-[#EDF6FF] dark:bg-[#263B2E]"
          />

          <BenefitCard
            emoji="🤝"
            title="Apoie boas causas"
            iconBackground="bg-[rgba(218,190,37,0.16)] dark:bg-[#403B24]"
          />

          <BenefitCard
            emoji="💚"
            title="Faça a diferença"
            iconBackground="bg-[rgba(157,67,194,0.12)] dark:bg-[#392B40]"
          />
        </View>

        {/* Orientação para doação */}
        <View className="mt-7 min-h-[60px] flex-row items-center justify-center gap-[10px] rounded-[18px] border border-[rgba(95,129,183,0.18)] bg-white/[0.92] px-3 py-3 shadow-[0px_14px_28px_rgba(95,129,183,0.12)] dark:border-[#34463A] dark:bg-[#1C2921] dark:shadow-none">
          <Text className="text-[22px]">📱</Text>

          <Text className="shrink text-center text-[15px] font-extrabold text-[#1F2B3D] dark:text-[#F0F5F1]">
            Para doar, escaneie o QR Code do ponto de coleta
          </Text>
        </View>

        {/* Rodapé */}
        <Text className="mt-3.5 text-center text-[13px] leading-5 text-[#4F5D72] dark:text-[#B5C4B8]">
          Consulte as orientações de coleta diretamente
          pelo navegador.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}