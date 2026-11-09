import { useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { router } from 'expo-router';

import { getCollectionPoint } from '@/services/collection-points';

export default function LerQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleBarcodeScanned({
    data,
  }: {
    data: string;
  }) {
    if (!scanning || loading) return;

    setScanning(false);
    setLoading(true);
    setError('');

    try {
      const match = data.trim().match(/\d+$/);

      if (!match) {
        throw new Error(
          'QR Code inválido. Não foi possível identificar o ponto.'
        );
      }

      const pontoId = Number(match[0]);

      if (!Number.isInteger(pontoId) || pontoId <= 0) {
        throw new Error('Identificador do ponto inválido.');
      }

      // Verifica se o ponto existe e está aprovado.
      await getCollectionPoint(pontoId);

      // Abre a página do ponto de coleta.
      router.replace({
        pathname: '/ponto/[id]',
        params: {
          id: String(pontoId),
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível identificar o ponto de coleta.'
      );

      setScanning(true);
    } finally {
      setLoading(false);
    }
  }

  // Verificação da permissão da câmera.
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8F5FC] px-6">
        <ActivityIndicator size="large" color="#7952A3" />

        <Text className="mt-4 text-center text-[#302442]">
          Verificando permissão da câmera...
        </Text>
      </View>
    );
  }

  // Solicitação de permissão.
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8F5FC] px-6">
        <Text className="text-center text-2xl font-bold text-[#302442]">
          Acesso à câmera
        </Text>

        <Text className="mt-3 text-center text-base text-[#625570]">
          Precisamos acessar sua câmera para ler o QR Code do ponto de coleta.
        </Text>

        <Pressable
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Permitir acesso à câmera"
          className="mt-6 min-h-14 w-full items-center justify-center rounded-xl bg-[#7952A3] px-5 py-4"
        >
          <Text className="font-semibold text-white">
            Permitir acesso à câmera
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a página inicial"
          className="mt-4 min-h-12 justify-center px-5 py-3"
        >
          <Text className="font-medium text-[#68428F]">
            Voltar
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8F5FC]">
      {/* Cabeçalho */}
      <View className="px-6 pb-5 pt-14">
        <Text className="text-2xl font-bold text-[#302442]">
          Ler QR Code
        </Text>

        <Text className="mt-2 text-base leading-6 text-[#625570]">
          Posicione o código do ponto de coleta dentro da área de leitura.
        </Text>
      </View>

      {/* Câmera */}
      <View className="mx-5 flex-1 overflow-hidden rounded-3xl bg-[#21182C]">
        <CameraView
          className="flex-1"
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={
            scanning && !loading
              ? handleBarcodeScanned
              : undefined
          }
        />

        {/* Área de enquadramento */}
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
        >
          <View className="h-64 w-64 rounded-3xl border-[3px] border-white" />
        </View>

        {/* Carregamento */}
        {loading && (
          <View
            className="absolute inset-0 items-center justify-center bg-black/65"
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator size="large" color="#FFFFFF" />

            <Text className="mt-4 px-5 text-center font-semibold text-white">
              Verificando ponto de coleta...
            </Text>
          </View>
        )}
      </View>

      {/* Rodapé */}
      <View className="px-6 pb-8 pt-6">
        {error !== '' ? (
          <View
            className="mb-4 rounded-xl border border-[#E8C9D5] bg-[#FBEAF0] p-4"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text className="text-center font-medium leading-5 text-[#873B59]">
              {error}
            </Text>
          </View>
        ) : (
          <Text className="mb-4 text-center text-sm leading-5 text-[#625570]">
            Mantenha o QR Code centralizado para realizar a leitura.
          </Text>
        )}

        {/* Tentar novamente */}
        {error !== '' && (
          <Pressable
            onPress={() => {
              setError('');
              setScanning(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Tentar ler o QR Code novamente"
            className="mb-3 min-h-14 items-center justify-center rounded-xl bg-[#7952A3] px-5 py-4"
          >
            <Text className="font-semibold text-white">
              Tentar novamente
            </Text>
          </Pressable>
        )}

        {/* Voltar para Home */}
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a página inicial"
          className="min-h-14 items-center justify-center rounded-xl border border-[#7952A3] bg-[#F0EAF7] px-5 py-4"
        >
          <Text className="font-semibold text-[#68428F]">
            Voltar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
