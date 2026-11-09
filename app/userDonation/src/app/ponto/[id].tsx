import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { CollectionPoint } from '@/constants/collection-points';
import { getCollectionPoint } from '@/services/collection-points';

const steps = [
  {
    number: '01',
    title: 'Separe as tampinhas',
    description:
      'Separe as tampinhas plásticas e retire resíduos ou sujeiras aparentes.',
  },
  {
    number: '02',
    title: 'Prepare a pesagem',
    description:
      'Coloque as tampinhas no recipiente indicado pelo responsável do ponto.',
  },
  {
    number: '03',
    title: 'Confira o peso',
    description:
      'Posicione o recipiente na balança e aguarde o valor estabilizar. Peça ajuda ao responsável se necessário.',
  },
  {
    number: '04',
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
      className="flex-1 bg-[#FCF7F3] dark:bg-[#1C1715]"
      edges={['top']}
    >
      <View className="flex-1 items-center justify-center px-7">
        <View className="mb-5 h-[84px] w-[84px] items-center justify-center rounded-full border border-[#EBD2C3] bg-[#F8E8DE] dark:border-[#604438] dark:bg-[#382820]">
          {loading ? (
            <ActivityIndicator size="large" color="#A65F43" />
          ) : (
            <Text className="text-[32px] font-bold text-[#A65F43]">
              !
            </Text>
          )}
        </View>

        <Text className="text-center text-[25px] font-extrabold text-[#3D2922] dark:text-[#F8EDE7]">
          {title}
        </Text>

        <Text className="mt-3 text-center text-[15px] leading-[23px] text-[#72584D] dark:text-[#D2BFB5]">
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
      className="flex-1 bg-[#FCF7F3] dark:bg-[#1C1715]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] pb-9 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho do ponto */}
        <View className="rounded-[28px] border border-[#98543B] bg-[#A96549] p-6 shadow-[0px_14px_30px_rgba(139,77,52,0.14)] dark:border-[#A8755D] dark:bg-[#59392C] dark:shadow-none">
          <View className="mb-7 flex-row items-center justify-between">
            <Text className="text-[15px] font-extrabold tracking-[1px] text-[#FFF0E7]">
              TAMPETS
            </Text>

            <View className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5">
              <Text className="text-[10px] font-bold tracking-[1.5px] text-white">
                DOAÇÃO
              </Text>
            </View>
          </View>

          <Text className="text-[11px] font-bold tracking-[1.8px] text-[#F8DED0]">
            PONTO DE COLETA
          </Text>

          <Text className="mt-2 text-[27px] font-extrabold leading-[33px] text-white">
            {ponto.name}
          </Text>

          <Text className="mt-2.5 text-[14px] leading-[21px] text-[#FFF0E7]">
            {formatAddress(ponto)}
          </Text>

          <View className="mt-[18px] flex-row items-center gap-[7px] self-start rounded-full border border-white/20 bg-white/10 px-3 py-2">
            <View className="h-2 w-2 rounded-full bg-[#C9E5B7]" />
            <Text className="text-xs font-bold text-white">
              Ponto ativo
            </Text>
          </View>
        </View>

        {/* Horários de funcionamento */}
        <View className="mt-[22px] rounded-[22px] border border-[#EBD2C3] bg-[#F8E8DE] p-5 dark:border-[#604438] dark:bg-[#382820]">
          <Text className="text-[17px] font-extrabold text-[#3D2922] dark:text-[#F8EDE7]">
            Horário de funcionamento
          </Text>

          <Text className="mt-2 text-[14px] leading-[22px] text-[#72584D] dark:text-[#D2BFB5]">
            {ponto.opensDay}
          </Text>

          <Text className="text-[14px] font-bold text-[#965239] dark:text-[#E9B69C]">
            {ponto.hourInit} às {ponto.hourFinal}
          </Text>
        </View>

        {/* Mensagem de boas-vindas */}
        <View className="mt-[22px] rounded-[22px] border border-[#EBD2C3] bg-[#F8E8DE] p-5 dark:border-[#604438] dark:bg-[#382820]">
          <Text className="text-[19px] font-extrabold text-[#3D2922] dark:text-[#F8EDE7]">
            Sua atitude transforma!
          </Text>

          <Text className="mt-2 text-[14px] leading-[22px] text-[#72584D] dark:text-[#D2BFB5]">
            Veja como preparar e pesar suas tampinhas antes de entregá-las
            neste ponto de coleta.
          </Text>
        </View>

        {/* Introdução das etapas */}
        <View className="mt-7">
          <Text className="text-[23px] font-extrabold text-[#3D2922] dark:text-[#F8EDE7]">
            Como fazer sua doação
          </Text>

          <Text className="mt-[7px] text-[14px] leading-[21px] text-[#72584D] dark:text-[#D2BFB5]">
            Siga as etapas abaixo para realizar o procedimento.
          </Text>
        </View>

        {/* Etapas */}
        <View className="mt-4 gap-3">
          {steps.map((step) => (
            <View
              key={step.number}
              className="flex-row items-start gap-3 rounded-[20px] border border-[#EBD9CE] bg-white p-4 shadow-[0px_8px_18px_rgba(112,69,48,0.05)] dark:border-[#49362E] dark:bg-[#29211D] dark:shadow-none"
            >
              <View className="h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#F8E8DE] dark:bg-[#493229]">
                <Text className="text-[14px] font-extrabold text-[#965239] dark:text-[#E9B69C]">
                  {step.number}
                </Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-extrabold text-[#3D2922] dark:text-[#F8EDE7]">
                  {step.title}
                </Text>

                <Text className="mt-1.5 text-[13px] leading-5 text-[#72584D] dark:text-[#D2BFB5]">
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Aviso */}
        <View className="mt-4 rounded-[20px] border border-[#E6D5A9] bg-[#FFF7E5] p-[18px] dark:border-[#65552F] dark:bg-[#332B1D]">
          <Text className="mb-2 text-[15px] font-extrabold text-[#73521B] dark:text-[#F1D99A]">
            Antes de começar
          </Text>

          <Text className="text-[13px] leading-5 text-[#725F38] dark:text-[#E6D9B6]">
            A pesagem deve seguir as orientações do responsável pelo local.
            Esta página é um tutorial: ela não mede o peso nem registra uma
            doação automaticamente.
          </Text>
        </View>

        {/* Botão para iniciar a doação */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar doação"
          accessibilityHint="Abre a tela de pesagem para registrar sua doação."
          className="mt-6 min-h-[58px] flex-row items-center justify-center gap-2.5 rounded-[18px] border border-[#98543B] bg-[#A96549] px-5 py-[17px] shadow-[0px_10px_22px_rgba(139,77,52,0.16)] active:bg-[#8F5039] dark:border-[#B98267] dark:bg-[#80513D] dark:active:bg-[#704331]"
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

          <Text
            accessible={false}
            className="text-[20px] font-extrabold text-white"
          >
            →
          </Text>
        </Pressable>

        {/* Rodapé */}
        <Text className="mt-7 text-center text-[12px] text-[#80675C] dark:text-[#C8B5AA]">
          Tampets • Cada tampinha conta
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
