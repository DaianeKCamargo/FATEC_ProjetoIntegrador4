import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SucessoDoacaoScreen() {
  const { pontoId, peso } = useLocalSearchParams<{
    pontoId: string;
    peso: string;
  }>();

  const pesoFormatado = (peso ?? '0.75').replace('.', ',');

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFCF9] dark:bg-[#101A14]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Confirmação */}
        <View className="items-center">
          <View className="h-[100px] w-[100px] items-center justify-center rounded-full border border-[#C5E6CE] bg-[#E5F5E9] dark:border-[#385C41] dark:bg-[#203D2A]">
            <View className="h-[68px] w-[68px] items-center justify-center rounded-full bg-[#CDEBD5] dark:bg-[#2B5537]">
              <Text className="text-[45px] font-extrabold text-[#176638] dark:text-[#A7E5B5]">
                ✓
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center gap-2 rounded-full border border-[#B8DFC4] bg-[#E5F5E9] px-3 py-1.5 dark:border-[#385C41] dark:bg-[#203D2A]">
            <View className="h-2 w-2 rounded-full bg-[#247A45] dark:bg-[#86D99A]" />
            <Text className="text-[12px] font-bold text-[#185C32] dark:text-[#A7E5B5]">
              CONFIRMAÇÃO
            </Text>
          </View>

          <Text className="mt-3 text-center text-[28px] font-extrabold leading-[35px] text-[#193B29] dark:text-[#F0F5F1]">
            Doação confirmada!
          </Text>

          <Text className="mt-2.5 max-w-[330px] text-center text-[15px] leading-[23px] text-[#43594A] dark:text-[#C0CEC3]">
            Obrigado por fazer parte dessa mudança. Cada tampinha conta para
            um futuro melhor!
          </Text>
        </View>

        {/* Resumo da doação */}
        <View className="mt-7 overflow-hidden rounded-[24px] border border-[#D4E7D8] bg-white shadow-[0px_10px_28px_rgba(34,90,53,0.07)] dark:border-[#34463A] dark:bg-[#1C2921]">
          <View className="bg-[#E5F5E9] px-5 py-4 dark:bg-[#243D2B]">
            <Text className="text-[12px] font-extrabold tracking-[1.2px] text-[#245D38] dark:text-[#B4E8BF]">
              RESUMO DA DOAÇÃO
            </Text>
          </View>

          <View className="p-5">
            <Text className="text-[13px] font-semibold text-[#43594A] dark:text-[#C0CEC3]">
              Peso informado
            </Text>

            <View className="mt-1 flex-row items-baseline">
              <Text className="text-[38px] font-extrabold leading-[46px] text-[#176638] dark:text-[#A7E5B5]">
                {pesoFormatado}
              </Text>
              <Text className="ml-2 text-[17px] font-bold text-[#245D38] dark:text-[#B4E8BF]">
                kg
              </Text>
            </View>

            <View className="my-5 h-px bg-[#E1ECE3] dark:bg-[#34463A]" />

            <Text className="text-[12px] font-bold tracking-[1px] text-[#526758] dark:text-[#A9B9AC]">
              PONTO DE COLETA
            </Text>

            <View className="mt-3 flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#E5F5E9] dark:bg-[#243D2B]">
                <Text className="text-[22px]">📍</Text>
              </View>

              <View className="min-w-0 flex-1 justify-center">
                <Text className="text-[15px] font-extrabold leading-[22px] text-[#193B29] dark:text-[#F0F5F1]">
                  {pontoId ?? 'Não identificado'}
                </Text>
                <Text className="mt-1 text-[13px] leading-5 text-[#526758] dark:text-[#A9B9AC]">
                  Identificação do ponto desta doação
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Impacto positivo */}
        <View className="mt-5 flex-row items-start gap-3 rounded-[20px] border border-[#CDE6D3] bg-[#F0F8F1] p-4 dark:border-[#344E39] dark:bg-[#1B2D21]">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#D8EFDE] dark:bg-[#294832]">
            <Text className="text-[24px]">🌱</Text>
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[16px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
              Você fez a diferença!
            </Text>

            <Text className="mt-1.5 text-[14px] leading-[21px] text-[#43594A] dark:text-[#C0CEC3]">
              Sua contribuição ajuda a incentivar a reciclagem e o descarte
              correto de tampinhas.
            </Text>
          </View>
        </View>

        {/* Aviso transparente */}
        <View className="mt-4 flex-row items-start gap-2 rounded-[14px] bg-[#F0F2EF] p-3.5 dark:bg-[#222D25]">
          <Text className="text-[16px]">ℹ️</Text>

          <Text className="min-w-0 flex-1 text-[12px] leading-[18px] text-[#414B43] dark:text-[#C0CEC3]">
            Esta é uma confirmação demonstrativa. A doação ainda não foi
            salva no banco de dados.
          </Text>
        </View>

        {/* Ação principal */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao início"
          className="mt-6 min-h-[56px] flex-row items-center justify-center gap-2 rounded-[16px] border border-[#176638] bg-[#176638] px-5 py-4 active:bg-[#124F2B] dark:border-[#438B55] dark:bg-[#286B3D] dark:active:bg-[#205630]"
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className="text-[16px] font-extrabold text-white">
            Voltar ao início
          </Text>
          <Text className="text-[19px] font-bold text-white">→</Text>
        </Pressable>

        {/* Rodapé */}
        <Text className="mt-5 text-center text-[12px] font-semibold text-[#526758] dark:text-[#A9B9AC]">
          Tampets • Cada tampinha conta 💚
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
