
import { useState } from 'react';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collectionPoints } from '@/constants/collection-points';
import type { CollectionPoint } from '@/constants/collection-points';

export default function LerQrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [point, setPoint] = useState<CollectionPoint | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  function handleBarcodeScanned(data: string) {
    if (scanned) return;

    setScanned(true);

    const prefix = 'TAMPETS:';

    if (!data.startsWith(prefix)) {
      setMessage('QR Code inválido. Escaneie um código do Tampets.');
      return;
    }

    const pointId = data.slice(prefix.length).trim().toUpperCase();
    const foundPoint = collectionPoints.find(
      (item) => item.id === pointId
    );

    if (!foundPoint) {
      setMessage('Ponto de coleta não encontrado.');
      return;
    }

    if (foundPoint.status !== 'active') {
      setMessage('Este ponto de coleta está inativo.');
      return;
    }

    setPoint(foundPoint);
    setMessage(null);
  }

  function resetScanner() {
    setPoint(null);
    setMessage(null);
    setScanned(false);
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Precisamos da sua câmera</Text>
        <Text style={styles.description}>
          Autorize o acesso à câmera para escanear o QR Code do ponto de coleta.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir câmera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Escaneie o QR Code</Text>
      <Text style={styles.description}>
        Aponte a câmera para o código do ponto de coleta.
      </Text>

      {!scanned && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleBarcodeScanned(data)}
          />
        </View>
      )}

      {point ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Ponto identificado!</Text>
          <Text style={styles.pointName}>{point.name}</Text>
          <Text style={styles.resultText}>Código: {point.id}</Text>
          <Text style={styles.resultText}>Endereço: {point.address}</Text>
          <Text style={styles.status}>Status: Ativo</Text>

        <Pressable
            style={styles.button}
            onPress={() =>
                router.push({
                pathname: '/doacao',
                params: { pontoId: point.id },
                })
            }
            >
            <Text style={styles.buttonText}>Iniciar doação</Text>
        </Pressable>
          <Pressable style={styles.button} onPress={resetScanner}>
            <Text style={styles.buttonText}>Escanear outro ponto</Text>
          </Pressable>
        </View>
      ) : message ? (
        <View style={styles.result}>
          <Text style={styles.error}>{message}</Text>
          <Pressable style={styles.button} onPress={resetScanner}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.hint}>
          Posicione o código dentro da área da câmera.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBF5',
    padding: 24,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#F7FBF5',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#173D2B',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#5C7163',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#202C25',
  },
  hint: {
    color: '#5C7163',
    textAlign: 'center',
    marginTop: 20,
  },
  result: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  resultTitle: {
    color: '#168447',
    fontSize: 20,
    fontWeight: '800',
  },
  pointName: {
    color: '#173D2B',
    fontSize: 18,
    fontWeight: '700',
  },
  resultText: {
    color: '#173D2B',
    fontSize: 14,
    lineHeight: 21,
  },
  status: {
    color: '#168447',
    fontWeight: '700',
  },
  error: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#168447',
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
