import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CollectionPoint } from '@/constants/collection-points';
import { getCollectionPoint } from '@/services/collection-points';

function ProgressBar() {
  return (
    <View className="mb-5 w-full">
      <View className="w-full rounded-[22px] border border-[#EBD2C3] bg-white px-4 py-4 dark:border-[#49362E] dark:bg-[#29211D] sm:px-6 sm:py-5 md:px-8">
        {/* Logo */}
        <View className="mb-6 w-full items-center justify-center">
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{
              width: 185,
              height: 68,
            }}
            resizeMode="contain"
            accessibilityLabel="Logo Tampets"
          />
        </View>

        {/* Etapas */}
        <View className="w-full flex-row items-start">
          {/* Instrução */}
          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#8B4B2B]">
              <Text className="text-sm font-bold text-white">1</Text>
            </View>
            <Text className="mt-2 text-center text-xs font-semibold text-[#8B4B2B]">
              Instrução
            </Text>
          </View>

          {/* Linha */}
          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#EBD2C3] dark:bg-[#49362E]" />
          </View>

          {/* Doação */}
          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EBD2C3] dark:bg-[#49362E]">
              <Text className="text-sm font-bold text-[#8B4B2B] dark:text-[#D8B7A5]">
                2
              </Text>
            </View>
            <Text className="mt-2 text-center text-xs font-semibold text-[#927F75] dark:text-[#B6A49A]">
              Doação
            </Text>
          </View>

          {/* Linha */}
          <View className="flex-1 pt-[17px]">
            <View className="h-[2px] w-full bg-[#EBD2C3] dark:bg-[#49362E]" />
          </View>

          {/* Confirmação */}
          <View className="flex-1 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EBD2C3] dark:bg-[#49362E]">
              <Text className="text-sm font-bold text-[#8B4B2B] dark:text-[#D8B7A5]">
                3
              </Text>
            </View>
            <Text className="mt-2 text-center text-xs font-semibold text-[#927F75] dark:text-[#B6A49A]">
              Confirmação
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MessageScreen({
  title,
  message,
  loading = false,
  isDark,
  onBack,
}: {
  title: string;
  message: string;
  loading?: boolean;
  isDark: boolean;
  onBack: () => void;
}) {
  return (
    <SafeAreaView
      className={`flex-1 items-center justify-center px-4 ${
        isDark ? 'bg-[#171311]' : 'bg-[#FFF9F5]'
      }`}
    >
      <View className="w-full rounded-3xl border border-[#EBD2C3] bg-white p-7 dark:border-[#49362E] dark:bg-[#29211D]">
        {loading && (
          <ActivityIndicator
            size="large"
            color={isDark ? '#E8B99F' : '#8B4B2B'}
          />
        )}

        <Text className="mt-4 text-center text-xl font-bold text-[#59331F] dark:text-[#F4E6DE]">
          {title}
        </Text>

        <Text className="mt-2 text-center text-sm leading-6 text-[#806B60] dark:text-[#C8B5AA]">
          {message}
        </Text>

        {!loading && (
          <Pressable
            onPress={onBack}
            className="mt-6 w-full items-center rounded-xl bg-[#8B4B2B] px-5 py-4"
            accessibilityRole="button"
          >
            <Text className="font-bold text-white">Voltar</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function PontoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [ponto, setPonto] = useState<CollectionPoint | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function carregarPonto() {
      try {
        setCarregando(true);
        setErro(false);

        const pontoId = Number(id);

        if (!Number.isInteger(pontoId) || pontoId <= 0) {
          throw new Error('ID inválido');
        }

        const resultado = await getCollectionPoint(pontoId);

        if (resultado.status !== 'APROVADO') {
          throw new Error('Ponto indisponível');
        }

        setPonto(resultado);
      } catch (error) {
        console.error('Erro ao carregar ponto:', error);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    carregarPonto();
  }, [id]);

  function iniciarDoacao() {
    if (!ponto) return;

    router.push({
      pathname: '/doacao',
      params: {
        pontoId: String(ponto.id),
      },
    });
  }

  function voltarInicio() {
    router.replace('/(tabs)');
  }

  if (carregando) {
    return (
      <MessageScreen
        title="Carregando ponto de coleta"
        message="Estamos buscando as informações do ponto. Aguarde um instante."
        loading
        isDark={isDark}
        onBack={voltarInicio}
      />
    );
  }

  if (erro || !ponto) {
    return (
      <MessageScreen
        title="Ponto não encontrado"
        message="Não foi possível encontrar esse ponto de coleta. Verifique o QR Code ou tente novamente."
        isDark={isDark}
        onBack={voltarInicio}
      />
    );
  }

  const endereco = ponto.address;

  return (
    <SafeAreaView
      className={`flex-1 ${
        isDark ? 'bg-[#171311]' : 'bg-[#FFF9F5]'
      }`}
    >
      <ScrollView
        className="w-full flex-1"
        contentContainerClassName="w-full flex-grow px-2 pb-8 pt-3 sm:px-3 md:px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full">
          {/* Logo e progresso */}
          <ProgressBar />

          {/* Cabeçalho do ponto */}
          <View className="mb-5 w-full rounded-[26px] bg-[#8B4B2B] p-5 sm:p-7 md:p-8">
            <Text className="text-xs font-bold uppercase tracking-[2px] text-[#F4D9C8]">
              PONTO DE COLETA
            </Text>

            <Text className="mt-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              {ponto.name}
            </Text>

            <Text className="mt-2 text-sm leading-6 text-white sm:text-base">
              {endereco.street}, {endereco.number}
              {endereco.complement ? ` - ${endereco.complement}` : ''}
              {' • '}
              {endereco.district}
              {' • '}
              {endereco.city}
            </Text>

            <View className="mt-4 self-start rounded-full bg-[#F2DCCF] px-4 py-2">
              <Text className="text-xs font-bold text-[#704027]">
                Ponto aprovado
              </Text>
            </View>
          </View>

          {/* Endereço */}
          <View className="mb-5 w-full rounded-[22px] border border-[#EBD2C3] bg-white p-5 dark:border-[#49362E] dark:bg-[#29211D] sm:p-6">
            <Text className="text-lg font-bold text-[#59331F] dark:text-[#F4E6DE] sm:text-xl">
              Endereço do ponto
            </Text>

            <Text className="mt-3 text-sm leading-6 text-[#806B60] dark:text-[#C8B5AA] sm:text-base">
              {endereco.street}, {endereco.number}
              {endereco.complement ? ` - ${endereco.complement}` : ''}
              {'\n'}
              {endereco.district}
              {'\n'}
              {endereco.city} - CEP {endereco.postCode}
            </Text>
          </View>

          {/* Horário */}
          <View className="mb-5 w-full rounded-[22px] border border-[#EBD2C3] bg-white p-5 dark:border-[#49362E] dark:bg-[#29211D] sm:p-6">
            <Text className="text-lg font-bold text-[#59331F] dark:text-[#F4E6DE] sm:text-xl">
              Horário de funcionamento
            </Text>

            <Text className="mt-3 text-sm leading-6 text-[#806B60] dark:text-[#C8B5AA] sm:text-base">
              {ponto.opensDay}
            </Text>

            <Text className="mt-1 text-base font-semibold text-[#8B4B2B] dark:text-[#E8B99F]">
              {ponto.hourInit} às {ponto.hourFinal}
            </Text>
          </View>

          {/* Introdução */}
          <View className="mb-5 w-full">
            <Text className="text-xl font-extrabold text-[#59331F] dark:text-[#F4E6DE] sm:text-2xl">
              Sua doação começa aqui!
            </Text>

            <Text className="mt-2 text-sm leading-6 text-[#806B60] dark:text-[#C8B5AA] sm:text-base">
              Siga as instruções abaixo para preparar suas tampinhas e
              registrar sua contribuição.
            </Text>
          </View>

          {/* Instruções */}
          <View className="mb-5 w-full rounded-[22px] border border-[#EBD2C3] bg-white p-5 dark:border-[#49362E] dark:bg-[#29211D] sm:p-6">
            <Text className="mb-5 text-lg font-bold text-[#59331F] dark:text-[#F4E6DE] sm:text-xl">
              Como realizar sua doação
            </Text>

            {[
              {
                number: '1',
                title: 'Separe as tampinhas',
                description:
                  'Separe as tampinhas plásticas que deseja doar.',
              },
              {
                number: '2',
                title: 'Prepare a pesagem',
                description:
                  'Deixe as tampinhas prontas para serem colocadas na balança.',
              },
              {
                number: '3',
                title: 'Confira o peso',
                description:
                  'Acompanhe a leitura do peso durante o registro da doação.',
              },
              {
                number: '4',
                title: 'Entregue sua doação',
                description:
                  'Finalize o registro e contribua com o projeto.',
              },
            ].map((step, index) => (
              <View
                key={step.number}
                className={`flex-row items-start ${
                  index !== 3 ? 'mb-5' : ''
                }`}
              >
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-[#F2DCCF] dark:bg-[#49362E]">
                  <Text className="font-bold text-[#8B4B2B] dark:text-[#E8B99F]">
                    {step.number}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-bold text-[#59331F] dark:text-[#F4E6DE]">
                    {step.title}
                  </Text>

                  <Text className="mt-1 text-sm leading-5 text-[#806B60] dark:text-[#C8B5AA]">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Aviso */}
          <View className="mb-5 w-full rounded-[18px] border border-[#E8C9A8] bg-[#FFF1DF] p-4 dark:border-[#604832] dark:bg-[#35291F]">
            <Text className="text-sm leading-6 text-[#79502F] dark:text-[#E8C9A8]">
              Antes de continuar, confira se suas tampinhas estão separadas
              e prontas para a pesagem.
            </Text>
          </View>

          {/* Iniciar doação */}
          <Pressable
            onPress={iniciarDoacao}
            className="w-full items-center rounded-2xl bg-[#8B4B2B] px-6 py-4 active:bg-[#704027]"
            accessibilityRole="button"
            accessibilityLabel="Iniciar doação"
          >
            <Text className="text-base font-bold text-white sm:text-lg">
              Iniciar doação
            </Text>
          </Pressable>

          {/* Voltar */}
          <Pressable
            onPress={voltarInicio}
            className="mt-3 w-full items-center rounded-2xl border border-[#EBD2C3] bg-white px-6 py-4 dark:border-[#49362E] dark:bg-[#29211D]"
            accessibilityRole="button"
            accessibilityLabel="Voltar ao início"
          >
            <Text className="font-semibold text-[#806B60] dark:text-[#C8B5AA]">
              Voltar ao início
            </Text>
          </Pressable>

          <Text className="mt-6 text-center text-xs text-[#A18C80] dark:text-[#9F8C82]">
            Cada tampinha conta!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
