import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import {
  calibrateBalance,
  configureBalance,
  getCollectionPoints,
  tareBalance,
  type CollectionPoint,
} from "@/services/balanceConfigurationService";

const DONATION_APP_URL = (
  process.env.EXPO_PUBLIC_DONATION_APP_URL || "https://doetampinhas.vercel.app"
).replace(/\/+$/, "");

type QRCodeSvgRef = {
  toDataURL: (
    callback: (base64: string) => void,
    options?: { width?: number; height?: number }
  ) => void;
};

export default function Settings() {
  const qrCodeRef = useRef<QRCodeSvgRef | null>(null);
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [referenceWeight, setReferenceWeight] = useState("");
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taring, setTaring] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [qrError, setQrError] = useState("");
  const [calibrationFeedback, setCalibrationFeedback] = useState<{
    type: "pending" | "success" | "error";
    message: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadPoints = useCallback(async () => {
    setLoadingPoints(true);
    setPointsError("");

    try {
      setPoints(await getCollectionPoints());
    } catch (error) {
      setPointsError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os pontos de coleta."
      );
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCollectionPoints()
      .then((loadedPoints) => {
        if (active) {
          setPoints(loadedPoints);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPointsError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os pontos de coleta."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPoints(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPoints = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    if (!term) {
      return points;
    }

    return points.filter((point) =>
      point.name.toLocaleLowerCase("pt-BR").includes(term)
    );
  }, [points, search]);

  const pointUrl = selectedPoint
    ? `${DONATION_APP_URL}/ponto/${selectedPoint.id}`
    : "";

  async function zeroBalance() {
    setTaring(true);
    setCalibrationFeedback(null);

    try {
      await tareBalance();
      setCalibrationFeedback({
        type: "success",
        message: "Balança zerada. Coloque agora o peso de referência.",
      });
    } catch (error) {
      setCalibrationFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível zerar a balança.",
      });
    } finally {
      setTaring(false);
    }
  }

  async function calibrateScale() {
    const weight = Number(referenceWeight.trim().replace(",", "."));

    if (!Number.isFinite(weight) || weight <= 0) {
      setCalibrationFeedback({
        type: "error",
        message: "Informe o peso conhecido em kg.",
      });
      return;
    }

    setCalibrating(true);
    setCalibrationFeedback({
      type: "pending",
      message:
        "Calibragem em andamento. Aguarde a estabilização e mantenha o peso imóvel; ainda não foi concluída.",
    });

    try {
      const { factor, measuredWeight } = await calibrateBalance(weight);
      setCalibrationFeedback({
        type: "success",
        message: `Calibragem salva. Referência: ${weight.toLocaleString(
          "pt-BR",
          { maximumFractionDigits: 3 }
        )} kg; leitura verificada: ${measuredWeight.toLocaleString("pt-BR", {
          maximumFractionDigits: 3,
        })} kg. Fator interno: ${factor.toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })} contagens/kg (não representa o peso).`,
      });
    } catch (error) {
      setCalibrationFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível calibrar a balança.",
      });
    } finally {
      setCalibrating(false);
    }
  }

  async function saveConfiguration() {
    if (!selectedPoint) {
      setFeedback({
        type: "error",
        message: "Selecione um ponto de coleta.",
      });
      return;
    }

    if (!ssid.trim() || ssid.length > 32) {
      setFeedback({
        type: "error",
        message: "Informe um nome de Wi-Fi válido (até 32 caracteres).",
      });
      return;
    }

    if (password.length > 0 && (password.length < 8 || password.length > 63)) {
      setFeedback({
        type: "error",
        message: "A senha do Wi-Fi deve ter entre 8 e 63 caracteres.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await configureBalance({
        ssid,
        password,
        pontoId: selectedPoint.id,
      });
      setFeedback({
        type: "success",
        message:
          "Configuração salva. A balança vai reiniciar e tentar conectar; confirme no monitor serial se o Wi-Fi conectou.",
      });
      setPassword("");
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível configurar a balança.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function downloadQrCode() {
    if (!selectedPoint) {
      return;
    }

    setDownloadingQr(true);
    setQrError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        if (!qrCodeRef.current) {
          reject(new Error("O QR Code ainda não está pronto."));
          return;
        }

        qrCodeRef.current.toDataURL(resolve, { width: 1024, height: 1024 });
      });

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = `data:image/png;base64,${base64}`;
        link.download = `qr-ponto-${selectedPoint.id}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("O compartilhamento de arquivos não está disponível.");
      }

      const cacheDirectory = FileSystem.cacheDirectory;

      if (!cacheDirectory) {
        throw new Error("Não foi possível acessar o armazenamento do aparelho.");
      }

      const fileUri = `${cacheDirectory}qr-ponto-${selectedPoint.id}.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri, {
        dialogTitle: `QR Code do ponto ${selectedPoint.name}`,
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch (error) {
      setQrError(
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o QR Code."
      );
    } finally {
      setDownloadingQr(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFE]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-9 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-7 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-extrabold text-[#2D4F83]">
              Configurações
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              Vincule a balança a um ponto e configure o Wi-Fi.
            </Text>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
            <Ionicons name="settings-outline" size={28} color="#8754BF" />
          </View>
        </View>

        <View className="mb-6 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <View className="mb-2 flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#8754BF"
            />
            <Text className="ml-2 font-bold text-[#69409A]">
              Conectar ao ponto de acesso da balança
            </Text>
          </View>
          <Text className="text-sm leading-5 text-slate-700">
            No primeiro uso, ligue a balança e conecte o celular à rede
            TamPets-Config. Para reconfigurar, com a balança ligada, segure o
            botão BOOT por 5 segundos. Se o celular avisar que a rede não tem
            internet, permaneça conectado e volte para este app.
          </Text>
          <Text className="mt-2 text-xs leading-5 text-slate-600">
            A configuração é enviada localmente para 192.168.4.1. A senha da
            rede informada não é salva no banco de dados.
          </Text>
        </View>

        <Text className="mb-3 text-lg font-bold text-slate-800">
          1. Selecione o ponto de coleta
        </Text>

        <View className="mb-3 rounded-xl bg-purple-50 p-4">
          <Text className="text-sm leading-5 text-slate-700">
            Digite o nome para filtrar os pontos e toque no resultado correto.
            Confira o nome, a cidade e o bairro. Depois da seleção, o QR Code
            será exibido abaixo; toque em “Baixar QR Code” para salvá-lo para o
            totem.
          </Text>
        </View>

        {selectedPoint ? (
          <View className="mb-4 flex-row items-center rounded-2xl border border-[#8754BF] bg-purple-50 p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
              <Ionicons name="location-outline" size={23} color="#8754BF" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-bold text-slate-800">
                {selectedPoint.name}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                ID {selectedPoint.id} · {selectedPoint.address.city} ·{" "}
                {selectedPoint.address.district}
              </Text>
            </View>
            <TouchableOpacity
              className="ml-2 rounded-lg bg-white px-3 py-2"
              onPress={() => {
                setSelectedPoint(null);
                setSearch("");
                setQrError("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Trocar ponto de coleta"
            >
              <Text className="font-semibold text-[#8754BF]">Trocar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View className="mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
              <Ionicons name="search-outline" size={21} color="#64748B" />
              <TextInput
                className="ml-3 flex-1 py-4 text-base text-slate-800"
                placeholder="Digite o nome do ponto..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                accessibilityLabel="Buscar ponto de coleta pelo nome"
              />
            </View>

            {search.trim().length > 0 &&
              !loadingPoints &&
              !pointsError && (
                <View className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {filteredPoints.length > 0 ? (
                    filteredPoints.map((point) => (
                      <TouchableOpacity
                        key={point.id}
                        className="flex-row items-center border-b border-slate-100 px-4 py-3"
                        onPress={() => {
                          setSelectedPoint(point);
                          setSearch("");
                          setQrError("");
                          setFeedback(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar ${point.name}`}
                      >
                        <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                          <Ionicons
                            name="location-outline"
                            size={20}
                            color="#8754BF"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-slate-800">
                            {point.name}
                          </Text>
                          <Text className="mt-1 text-xs text-slate-500">
                            ID {point.id} · {point.address.city} ·{" "}
                            {point.address.district}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className="px-4 py-3 text-sm text-slate-500">
                      Nenhum ponto com esse nome.
                    </Text>
                  )}
                </View>
              )}
          </>
        )}

        {selectedPoint && (
          <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="mb-4 text-lg font-bold text-slate-800">
              QR Code para o totem
            </Text>
            <View className="mb-4 self-center rounded-2xl bg-white p-3">
              <QRCode
                value={pointUrl}
                size={220}
                quietZone={12}
                getRef={(ref: QRCodeSvgRef | null) => {
                  qrCodeRef.current = ref;
                }}
              />
            </View>
            <Text
              className="mb-4 text-center text-xs text-slate-500"
              numberOfLines={2}
              selectable
            >
              {pointUrl}
            </Text>
            <TouchableOpacity
              className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${
                downloadingQr ? "bg-purple-300" : "bg-[#8754BF]"
              }`}
              onPress={() => void downloadQrCode()}
              disabled={downloadingQr}
              accessibilityRole="button"
            >
              {downloadingQr ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text className="ml-2 font-bold text-white">
                    Baixar QR Code
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {qrError !== "" && (
              <Text
                className="mt-3 text-center text-sm text-red-700"
                accessibilityLiveRegion="polite"
              >
                {qrError}
              </Text>
            )}
          </View>
        )}

        {loadingPoints && (
          <View className="items-center py-8">
            <ActivityIndicator color="#8754BF" />
            <Text className="mt-3 text-sm text-slate-500">
              Carregando pontos de coleta...
            </Text>
          </View>
        )}

        {!loadingPoints && pointsError !== "" && (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Text className="text-sm text-red-700">{pointsError}</Text>
            <TouchableOpacity
              className="mt-3 self-start rounded-xl bg-white px-4 py-2"
              onPress={() => void loadPoints()}
              accessibilityRole="button"
            >
              <Text className="font-semibold text-red-700">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text className="mb-3 mt-5 text-lg font-bold text-slate-800">
          2. Calibre a balança
        </Text>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-4 gap-2 rounded-xl bg-purple-50 p-4">
            <Text className="text-sm leading-5 text-slate-700">
              <Text className="font-bold">1. Zere a balança:</Text> deixe a
              plataforma vazia e toque em “Zerar balança sem peso”. Aguarde a
              confirmação; a balança leva 3 segundos para capturar o zero.
            </Text>
            <Text className="text-sm leading-5 text-slate-700">
              <Text className="font-bold">2. Prepare o peso:</Text> coloque na
              plataforma um objeto de peso conhecido e informe o valor exato em
              quilogramas no campo abaixo.
            </Text>
            <Text className="text-sm leading-5 text-slate-700">
              <Text className="font-bold">3. Calibre:</Text> toque em “Calibrar
              com peso de referência” e mantenha o objeto imóvel por 1 minuto.
              A tela avisará quando a calibragem for concluída ou se ocorrer um
              erro.
            </Text>
            <Text className="text-xs leading-5 text-slate-600">
              Depois da calibragem, configure o Wi-Fi; essa etapa reinicia o
              ESP32. O fator interno é expresso em contagens/kg, não em kg.
            </Text>
          </View>

          <TouchableOpacity
            className={`mb-4 flex-row items-center justify-center rounded-xl border border-[#8754BF] px-4 py-3 ${
              taring || calibrating ? "opacity-50" : ""
            }`}
            onPress={() => void zeroBalance()}
            disabled={taring || calibrating || saving}
            accessibilityRole="button"
          >
            {taring ? (
              <>
                <ActivityIndicator color="#8754BF" />
                <Text className="ml-2 font-bold text-[#8754BF]">
                  Estabilizando e zerando...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#8754BF" />
                <Text className="ml-2 font-bold text-[#8754BF]">
                  Zerar balança sem peso
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="mb-2 font-semibold text-slate-700">
            Peso de referência (kg)
          </Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800"
            placeholder="Ex.: 1,000"
            placeholderTextColor="#94A3B8"
            value={referenceWeight}
            onChangeText={setReferenceWeight}
            keyboardType="decimal-pad"
            accessibilityLabel="Peso conhecido usado para calibrar, em quilogramas"
          />

          <TouchableOpacity
            className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${
              calibrating || taring ? "bg-purple-300" : "bg-[#8754BF]"
            }`}
            onPress={() => void calibrateScale()}
            disabled={calibrating || taring || saving}
            accessibilityRole="button"
          >
            {calibrating ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text className="ml-2 font-bold text-white">
                  Aguardando 1 minuto e conferindo...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="scale-outline" size={20} color="#FFFFFF" />
                <Text className="ml-2 font-bold text-white">
                  Calibrar com peso de referência
                </Text>
              </>
            )}
          </TouchableOpacity>

          {calibrationFeedback && (
            <View
              className={`mt-4 rounded-xl p-3 ${
                calibrationFeedback.type === "success"
                  ? "bg-green-50"
                  : calibrationFeedback.type === "error"
                    ? "bg-red-50"
                    : "bg-yellow-50"
              }`}
              accessibilityLiveRegion="polite"
            >
              <Text
                className={`text-sm leading-5 ${
                  calibrationFeedback.type === "success"
                    ? "text-green-700"
                    : calibrationFeedback.type === "error"
                      ? "text-red-700"
                      : "text-yellow-800"
                }`}
              >
                {calibrationFeedback.message}
              </Text>
            </View>
          )}
        </View>

        <Text className="mb-3 mt-5 text-lg font-bold text-slate-800">
          3. Configure o Wi-Fi da balança
        </Text>

        <View className="mb-4 gap-2 rounded-xl bg-purple-50 p-4">
          <Text className="text-sm leading-5 text-slate-700">
            <Text className="font-bold">1. Escolha a rede:</Text> informe o
            nome exato da rede Wi-Fi do local. Ela deve operar em 2,4 GHz.
          </Text>
          <Text className="text-sm leading-5 text-slate-700">
            <Text className="font-bold">2. Informe a senha:</Text> digite a
            senha da rede. Para uma rede aberta, deixe o campo de senha vazio.
          </Text>
          <Text className="text-sm leading-5 text-slate-700">
            <Text className="font-bold">3. Envie a configuração:</Text> toque
            no botão ao final da página. A balança salvará o ponto e os dados
            do Wi-Fi e será reiniciada; aguarde e verifique se conectou à rede.
          </Text>
        </View>

        <Text className="mb-2 font-semibold text-slate-700">
          Nome da rede Wi-Fi
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
          placeholder="Ex.: Minha rede"
          placeholderTextColor="#94A3B8"
          value={ssid}
          onChangeText={setSsid}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          accessibilityLabel="Nome da rede Wi-Fi"
        />

        <Text className="mb-2 font-semibold text-slate-700">
          Senha da rede Wi-Fi
        </Text>
        <TextInput
          className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800"
          placeholder="Deixe vazio para rede aberta"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={63}
          accessibilityLabel="Senha da rede Wi-Fi"
        />

        {feedback && (
          <View
            className={`mb-4 rounded-xl p-4 ${
              feedback.type === "success" ? "bg-green-50" : "bg-red-50"
            }`}
            accessibilityLiveRegion="polite"
          >
            <Text
              className={`text-sm leading-5 ${
                feedback.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {feedback.message}
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`flex-row items-center justify-center rounded-2xl px-5 py-4 ${
            saving || taring || calibrating || loadingPoints || !selectedPoint
              ? "bg-purple-300"
              : "bg-[#8754BF]"
          }`}
          onPress={() => void saveConfiguration()}
          disabled={
            saving || taring || calibrating || loadingPoints || !selectedPoint
          }
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={21} color="#FFFFFF" />
              <Text className="ml-2 text-base font-bold text-white">
                Enviar configuração à balança
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
