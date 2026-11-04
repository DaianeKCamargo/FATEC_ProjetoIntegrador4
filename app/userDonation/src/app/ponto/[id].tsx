
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CollectionPoint } from '@/constants/collection-points';
import { getCollectionPoint } from '@/services/collection-points';

const steps = [
  {
    number: '1',
    title: 'Separe as tampinhas',
    description:
      'Separe as tampinhas plásticas e retire resíduos ou sujeiras aparentes.',
  },
  {
    number: '2',
    title: 'Prepare a pesagem',
    description:
      'Coloque as tampinhas no recipiente indicado pelo responsável do ponto.',
  },
  {
    number: '3',
    title: 'Confira o peso',
    description:
      'Posicione o recipiente na balança e aguarde o valor estabilizar. Peça ajuda ao responsável se necessário.',
  },
  {
    number: '4',
    title: 'Entregue sua doação',
    description:
      'Informe o peso ao responsável pelo ponto e deixe as tampinhas no local indicado para reciclagem.',
  },
];

function formatAddress(ponto: CollectionPoint) {
  const { street, number, complement, district, city } = ponto.address;

  return [
    `${street}, ${number}`,
    complement,
    district,
    city,
  ]
    .filter(Boolean)
    .join(' • ');
}

function MessageScreen({
  title,
  message,
  loading = false,
}: {
  title: string;
  message: string;
  loading?: boolean;
}) {
  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFCF9] dark:bg-[#101A14]"
      edges={['top']}
    >
      <View className="flex-1 items-center justify-center px-7">
        <View className="mb-5 h-[84px] w-[84px] items-center justify-center rounded-full border border-[#D4E7D8] bg-[#E5F5E9] dark:border-[#344B3B] dark:bg-[#263B2E]">
          <Text className="text-[42px]">
            {loading ? '⏳' : '📍'}
          </Text>
        </View>

        <Text className="text-center text-[25px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
          {title}
        </Text>

        <Text className="mt-3 text-center text-[15px] leading-[23px] text-[#43594A] dark:text-[#C0CEC3]">
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function PontoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const pontoId = Array.isArray(id) ? id[0] : id;

  const [ponto, setPonto] = useState<CollectionPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function carregarPonto() {
      setLoading(true);
      setError(false);
      setPonto(null);

      const numericId = Number(pontoId);

      if (!pontoId || !Number.isInteger(numericId) || numericId <= 0) {
        setLoading(false);
        return;
      }

      try {
        const resultado = await getCollectionPoint(numericId);

        if (active) {
          setPonto(resultado);
        }
      } catch (err) {
        console.error('Erro ao carregar ponto:', err);

        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    carregarPonto();

    return () => {
      active = false;
    };
  }, [pontoId]);

  if (loading) {
    return (
      <MessageScreen
        title="Carregando ponto..."
        message="Estamos buscando as informações do ponto de coleta."
        loading
      />
    );
  }

  if (error) {
    return (
      <MessageScreen
        title="Não foi possível carregar"
        message="Verifique sua conexão e tente acessar o ponto novamente."
      />
    );
  }

  if (!ponto || ponto.status !== 'APROVADO') {
    return (
      <MessageScreen
        title="Ponto não encontrado"
        message="Confira o QR Code ou entre em contato com o responsável pelo ponto de coleta."
      />
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFCF9] dark:bg-[#101A14]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-9 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho do ponto */}
        <View className="rounded-[28px] border border-[#245D38] bg-[#176638] p-6 shadow-[0px_14px_30px_rgba(23,102,56,0.14)] dark:border-[#426C4D] dark:bg-[#203D2A] dark:shadow-none">
          <View className="mb-7 flex-row items-center justify-between">
            <Text className="text-[15px] font-extrabold text-[#E0F2E4]">
              TAMPETS
            </Text>

            <View className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
              <Text className="text-[10px] font-bold tracking-[1.5px] text-white">
                DOAÇÃO
              </Text>
            </View>
          </View>

          <Text className="text-[11px] font-bold tracking-[1.8px] text-[#D5EBDD]">
            PONTO DE COLETA
          </Text>

          <Text className="mt-2 text-[27px] font-extrabold leading-[33px] text-white">
            {ponto.name}
          </Text>

          <Text className="mt-2.5 text-[14px] leading-[21px] text-[#E5F2E8]">
            {formatAddress(ponto)}
          </Text>

          <View className="mt-[18px] flex-row items-center gap-[7px] self-start rounded-full border border-white/15 bg-white/10 px-3 py-2">
            <View className="h-2 w-2 rounded-full bg-[#A8E6B8]" />
            <Text className="text-xs font-bold text-white">
              Ponto ativo
            </Text>
          </View>
        </View>

        {/* Horários de funcionamento */}
        <View className="mt-[22px] rounded-[22px] border border-[#CDE6D3] bg-[#E5F5E9] p-5 dark:border-[#344B3B] dark:bg-[#1D3024]">
          <Text className="text-[17px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
            Horário de funcionamento
          </Text>

          <Text className="mt-2 text-[14px] leading-[22px] text-[#43594A] dark:text-[#C0CEC3]">
            {ponto.opensDay}
          </Text>

          <Text className="text-[14px] font-bold text-[#176638] dark:text-[#B9E6C4]">
            {ponto.hourInit} às {ponto.hourFinal}
          </Text>
        </View>

        {/* Mensagem de boas-vindas */}
        <View className="mt-[22px] rounded-[22px] border border-[#CDE6D3] bg-[#E5F5E9] p-5 dark:border-[#344B3B] dark:bg-[#1D3024]">
          <Text className="text-[19px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
            Sua atitude transforma!
          </Text>

          <Text className="mt-2 text-[14px] leading-[22px] text-[#43594A] dark:text-[#C0CEC3]">
            Veja como preparar e pesar suas tampinhas antes de entregá-las
            neste ponto de coleta.
          </Text>
        </View>

        {/* Introdução das etapas */}
        <View className="mt-7">
          <Text className="text-[23px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
            Como fazer sua doação
          </Text>

          <Text className="mt-[7px] text-[14px] leading-[21px] text-[#43594A] dark:text-[#C0CEC3]">
            Siga as etapas abaixo para realizar o procedimento.
          </Text>
        </View>

        {/* Etapas */}
        <View className="mt-4 gap-3">
          {steps.map((step) => (
            <View
              key={step.number}
              className="flex-row items-start gap-3 rounded-[20px] border border-[#D4E7D8] bg-white p-4 shadow-[0px_8px_18px_rgba(34,90,53,0.05)] dark:border-[#34463A] dark:bg-[#1C2921] dark:shadow-none"
            >
              <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#E5F5E9] dark:bg-[#304A37]">
                <Text className="text-[16px] font-extrabold text-[#176638] dark:text-[#B9E6C4]">
                  {step.number}
                </Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-extrabold text-[#193B29] dark:text-[#F0F5F1]">
                  {step.title}
                </Text>

                <Text className="mt-1.5 text-[13px] leading-5 text-[#43594A] dark:text-[#C0CEC3]">
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Aviso */}
        <View className="mt-4 rounded-[20px] border border-[#E9D99D] bg-[#FFF9E8] p-[18px] dark:border-[#65552B] dark:bg-[#332D1D]">
          <Text className="mb-2 text-[15px] font-extrabold text-[#77520A] dark:text-[#F5D98A]">
            Antes de começar
          </Text>

          <Text className="text-[13px] leading-5 text-[#775F2B] dark:text-[#E8D9AD]">
            A pesagem deve seguir as orientações do responsável pelo local.
            Esta página é um tutorial: ela não mede o peso nem registra uma
            doação automaticamente.
          </Text>
        </View>

        {/* Botão para iniciar a doação */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar doação"
          className="mt-6 min-h-[58px] flex-row items-center justify-center gap-2.5 rounded-[18px] border border-[#176638] bg-[#176638] px-5 py-[17px] shadow-[0px_10px_22px_rgba(23,102,56,0.16)] active:bg-[#124F2B] dark:border-[#65A978] dark:bg-[#286B3D] dark:active:bg-[#205A33]"
          onPress={() =>
            router.push({
              pathname: '/doacao',
              params: { pontoId: String(ponto.id) },
            })
          }
        >
          <Text className="text-[16px] font-extrabold text-white">
            Iniciar doação
          </Text>

          <Text className="text-[20px] font-extrabold text-white">
            →
          </Text>
        </Pressable>

        {/* Rodapé */}
        <Text className="mt-7 text-center text-[12px] text-[#526758] dark:text-[#B5C4B8]">
          Tampets • Cada tampinha conta
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
