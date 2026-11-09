
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type BenefitCardProps = {
  number: string;
  title: string;
  description: string;
  background: string;
};

function BenefitCard({
  number,
  title,
  description,
  background,
}: BenefitCardProps) {
  return (
    <View className="min-w-0 flex-1 rounded-2xl border border-[#E2EDE2] bg-white p-3.5 dark:border-[#34463A] dark:bg-[#1C2921]">
      <View
        className={`mb-3 h-9 w-9 items-center justify-center rounded-xl ${background}`}
      >
        <Text className="text-sm font-bold text-[#173D2B] dark:text-[#E0F2E4]">
          {number}
        </Text>
      </View>

      <Text className="text-sm font-bold leading-5 text-[#173D2B] dark:text-[#F0F5F1]">
        {title}
      </Text>

      <Text className="mt-1.5 text-xs leading-[18px] text-[#5C7163] dark:text-[#B5C4B8]">
        {description}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  function handleOpenScanner() {
    router.push('/ler-qr');
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#F7FBF5] dark:bg-[#101A14]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-10 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View className="items-center">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-[#168447]">
            Tampets
          </Text>

          <Text className="mt-3 text-center text-[32px] font-extrabold leading-[38px] text-[#173D2B] dark:text-[#F0F5F1]">
            Doe suas{'\n'}Tampinhas
          </Text>

          <Text className="mt-3 text-center text-base leading-6 text-[#5C7163] dark:text-[#C0CEC3]">
            Pequenas atitudes podem gerar grandes transformações.
          </Text>
        </View>

        {/* Destaque */}
        <View className="mt-8 overflow-hidden rounded-3xl border border-[#DCEBDD] bg-[#E8F5E9] p-5 dark:border-[#344B3B] dark:bg-[#1D3024]">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#168447] dark:text-[#8DD6A4]">
            Nosso propósito
          </Text>

          <Text className="mt-2 text-[22px] font-extrabold leading-7 text-[#173D2B] dark:text-[#E0F2E4]">
            Cada tampinha conta!
          </Text>

          <Text className="mt-2 text-sm leading-[22px] text-[#52665A] dark:text-[#C0CEC3]">
            Incentivamos a coleta de tampinhas plásticas para
            promover a conscientização ambiental e apoiar
            iniciativas sociais.
          </Text>
        </View>

        {/* Introdução */}
        <View className="mt-8">
          <Text className="text-[22px] font-extrabold text-[#173D2B] dark:text-[#F0F5F1]">
            Faça parte dessa iniciativa
          </Text>

          <Text className="mt-2 text-[15px] leading-[23px] text-[#5C7163] dark:text-[#C0CEC3]">
            Separe suas tampinhas, encontre um ponto de coleta
            e contribua para um futuro mais sustentável.
          </Text>
        </View>

        {/* Benefícios */}
        <View className="mt-6 flex-row gap-3">
          <BenefitCard
            number="01"
            title="Preservação"
            description="Incentive o descarte correto de materiais."
            background="bg-[#DDF1E1] dark:bg-[#263B2E]"
          />

          <BenefitCard
            number="02"
            title="Solidariedade"
            description="Contribua com projetos e causas sociais."
            background="bg-[#FFF1C9] dark:bg-[#403B24]"
          />

          <BenefitCard
            number="03"
            title="Participação"
            description="Faça parte de uma mudança coletiva."
            background="bg-[#FBE3E9] dark:bg-[#392B40]"
          />
        </View>

        {/* Acesso ao leitor QR Code */}
        <View className="mt-8 rounded-2xl border border-[#E2EDE2] bg-white p-5 dark:border-[#34463A] dark:bg-[#1C2921]">
          <Text className="text-lg font-bold text-[#173D2B] dark:text-[#F0F5F1]">
            Pronto para doar?
          </Text>

          <Text className="mt-2 text-sm leading-[21px] text-[#5C7163] dark:text-[#C0CEC3]">
            Escaneie o QR Code disponível no ponto de coleta
            para consultar as informações e iniciar sua doação.
          </Text>

          <Pressable
            onPress={handleOpenScanner}
            accessibilityRole="button"
            accessibilityLabel="Abrir leitor de QR Code"
            className="mt-5 min-h-[54px] flex-row items-center justify-center rounded-xl bg-[#168447] px-5 py-4 active:bg-[#126B39]"
          >
            <Text className="text-base font-bold text-white">
              Ler QR Code
            </Text>
          </Pressable>
        </View>

        {/* Rodapé */}
        <View className="mt-7 items-center border-t border-[#E2EDE2] pt-5 dark:border-[#34463A]">
          <Text className="text-center text-xs leading-5 text-[#718276] dark:text-[#A7B7AA]">
            Tampets — Cada tampinha conta.
          </Text>

          <Text className="mt-1 text-center text-xs text-[#718276] dark:text-[#A7B7AA]">
            Juntos por um futuro mais sustentável.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}