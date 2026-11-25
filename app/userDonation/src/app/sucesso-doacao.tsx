import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CollectionPoint } from '@/constants/collection-points';
import { getCollectionPoint } from '@/services/collection-points';

function ProgressBar() {
  return (
    <View className="mb-6 w-full">
      <View className="w-full rounded-[22px] border border-[#D4E7D8] bg-white px-4 py-4 dark:border-[#34463A] dark:bg-[#1C2921] sm:px-6 sm:py-5 md:px-8">
        <View className="mb-6 w-full items-center justify-center">
          <Image
            source={require('@/assets/images/logo.png')}
            style={{
              width: 185,
              height: 68,
            }}
            resizeMode="contain"
            accessibilityLabel="Logo Tampets"
          />
        </View>

        <View className="w-full flex-row items-start">
          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#176638]">
              <Text className="text-sm font-bold text-white">1</Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#176638] dark:text-[#A7E5B5]">
              Instrução
            </Text>
          </View>

          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#176638]" />
          </View>

          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#176638]">
              <Text className="text-sm font-bold text-white">2</Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#176638] dark:text-[#A7E5B5]">
              Doação
            </Text>
          </View>

          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#176638]" />
          </View>

          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#176638]">
              <Text className="text-sm font-bold text-white">3</Text>
            </View>

            <Text className="mt-2 text-center text-xs font-semibold text-[#176638] dark:text-[#A7E5B5]">
              Confirmação
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SucessoDoacaoScreen() {
  const { pontoId: parametroPonto, peso } =
    useLocalSearchParams<{
      pontoId?: string | string[];
      peso?: string;
    }>();

  const pontoId = Array.isArray(parametroPonto)
    ? parametroPonto[0]
    : parametroPonto;

  const [ponto, setPonto] = useState<CollectionPoint | null>(null);
  const [carregandoPonto, setCarregandoPonto] = useState(true);
  const [erroPonto, setErroPonto] = useState('');

  const pesoFormatado = Number(peso ?? 0)
    .toFixed(3)
    .replace('.', ',');

  useEffect(() => {
    let ativo = true;

    async function carregarPonto() {
      setCarregandoPonto(true);
      setErroPonto('');
      setPonto(null);

      const id = Number(pontoId);

      if (!pontoId || !Number.isInteger(id) || id <= 0) {
        setErroPonto('Identificação do ponto de coleta inválida.');
        setCarregandoPonto(false);
        return;
      }

      try {
        const resultado = await getCollectionPoint(id);

        if (ativo) {
          setPonto(resultado);
        }
      } catch (erroBusca) {
        console.error(
          '[SUCESSO DOAÇÃO] Erro ao buscar ponto:',
          erroBusca
        );

        if (ativo) {
          setErroPonto(
            'Não foi possível carregar os dados do ponto de coleta.'
          );
        }
      } finally {
        if (ativo) {
          setCarregandoPonto(false);
        }
      }
    }

    carregarPonto();

    return () => {
      ativo = false;
    };
  }, [pontoId]);

  const endereco = ponto
    ? [
        `${ponto.address.street}, ${ponto.address.number}`,
        ponto.address.complement,
        ponto.address.district,
        ponto.address.city,
      ]
        .filter(Boolean)
        .join(' • ')
    : '';

  const enderecoCompleto = ponto
    ? `${endereco} - ${ponto.address.postCode}`
    : '';

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFCF9] dark:bg-[#101A14]"
      edges={['top']}
    >
      <ScrollView
        className="w-full flex-1"
        contentContainerClassName="w-full flex-grow px-2 py-4 sm:px-3 md:px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full">
          <ProgressBar />

          {/* Confirmação */}
          <View className="w-full items-center">
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
          <View className="mt-7 w-full overflow-hidden rounded-[24px] border border-[#D4E7D8] bg-white shadow-[0px_10px_28px_rgba(34,90,53,0.07)] dark:border-[#34463A] dark:bg-[#1C2921]">
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

              {carregandoPonto ? (
                <View className="mt-4 flex-row items-center gap-3">
                  <ActivityIndicator color="#176638" />

                  <Text className="text-sm text-[#526758] dark:text-[#A9B9AC]">
                    Carregando informações do ponto...
                  </Text>
                </View>
              ) : erroPonto ? (
                <Text className="mt-3 text-sm leading-5 text-[#A12B35] dark:text-[#FFB7BE]">
                  {erroPonto}
                </Text>
              ) : ponto ? (
                <View className="mt-3">
                  <View className="flex-row items-start gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#E5F5E9] dark:bg-[#243D2B]">
                      <Text className="text-[22px]">📍</Text>
                    </View>

                    <View className="min-w-0 flex-1 justify-center">
                      <Text className="text-[16px] font-extrabold leading-[22px] text-[#193B29] dark:text-[#F0F5F1]">
                        {ponto.name}
                      </Text>

                      <Text className="mt-1 text-[13px] leading-5 text-[#526758] dark:text-[#A9B9AC]">
                        {enderecoCompleto}
                      </Text>
                    </View>
                  </View>

                  <View className="my-4 h-px bg-[#E1ECE3] dark:bg-[#34463A]" />

                  <View className="gap-4">
                    <View>
                      <Text className="text-[11px] font-bold tracking-wider text-[#526758] dark:text-[#A9B9AC]">
                        DIAS DE FUNCIONAMENTO
                      </Text>

                      <Text className="mt-1 text-sm font-semibold text-[#193B29] dark:text-[#F0F5F1]">
                        {ponto.opensDay}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-[11px] font-bold tracking-wider text-[#526758] dark:text-[#A9B9AC]">
                        HORÁRIO DE ATENDIMENTO
                      </Text>

                      <Text className="mt-1 text-sm font-semibold text-[#193B29] dark:text-[#F0F5F1]">
                        {ponto.hourInit} às {ponto.hourFinal}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-4 text-xs text-[#526758] dark:text-[#A9B9AC]">
                    Código do ponto: {ponto.id}
                  </Text>
                </View>
              ) : (
                <Text className="mt-3 text-sm text-[#A12B35] dark:text-[#FFB7BE]">
                  Ponto de coleta não encontrado.
                </Text>
              )}
            </View>
          </View>

          {/* Impacto positivo */}
          <View className="mt-5 w-full flex-row items-start gap-3 rounded-[20px] border border-[#CDE6D3] bg-[#F0F8F1] p-4 dark:border-[#344E39] dark:bg-[#1B2D21]">
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

          {/* Ação principal */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar ao início"
            className="mt-6 min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-[16px] border border-[#176638] bg-[#176638] px-5 py-4 active:bg-[#124F2B] dark:border-[#438B55] dark:bg-[#286B3D] dark:active:bg-[#205630]"
            onPress={() => {
              if (pontoId) {
                router.replace({
                  pathname: '/ponto/[id]',
                  params: { id: pontoId },
                });
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            <Text className="text-[16px] font-extrabold text-white">
              Voltar ao início
            </Text>

            <Text className="text-[19px] font-bold text-white">→</Text>
          </Pressable>

          {/* Rodapé */}
          <Text className="mt-5 pb-4 text-center text-[12px] font-semibold text-[#526758] dark:text-[#A9B9AC]">
            Tampets • Cada tampinha conta
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
