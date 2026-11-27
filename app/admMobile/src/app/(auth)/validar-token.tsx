
import { useLocalSearchParams, useRouter } from "expo-router";
import { validarTokenRecuperacao } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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

export default function ValidarToken() {
  const router = useRouter();

  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const [token, setToken] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleValidarToken() {
    if (carregando) return;

    if (!token.trim()) {
      setErro("Informe o código recebido por e-mail.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      await validarTokenRecuperacao(email, token.trim());

      router.push({
        pathname: "/(auth)/redefinir-senha",
        params: {
          email,
          token: token.trim(),
        },
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Token inválido ou expirado."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFE] overflow-hidden">

      {/* Decoração superior */}
      <View
        pointerEvents="none"
        className="absolute top-6 left-5 right-5 flex-row justify-around opacity-30"
      >
        <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
        <View className="w-[13px] h-[13px] rounded-full bg-[#E1D9FA]" />
        <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
      </View>

      {/* Decoração inferior */}
      <View
        pointerEvents="none"
        className="absolute bottom-7 left-5 right-5 flex-row justify-around opacity-25"
      >
        <View className="w-[13px] h-[13px] rounded-full bg-[#E1D9FA]" />
        <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 22,
            paddingVertical: 35,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[460px] self-center gap-[18px]">

            {/* Card */}
            <View className="bg-white rounded-[30px] overflow-hidden border border-[#E0E8F7]">

              {/* Faixa de gradiente */}
              <LinearGradient
                colors={["#587DBB", "#C15BDD"]}
                style={{ height: 7 }}
              />

              <View className="px-[27px] py-8">

                {/* Ícone */}
                <View className="w-[68px] h-[68px] rounded-3xl bg-[#F3E8FC] items-center justify-center self-center mb-5">
                  <Text className="text-[30px] text-[#A340C4]">
                    ✉
                  </Text>
                </View>

                {/* Título */}
                <Text className="text-[25px] font-black text-[#2D4F83] text-center mb-3">
                  Verifique seu e-mail
                </Text>

                <Text className="text-sm leading-[21px] text-[#64748B] text-center">
                  Enviamos um código de recuperação para:
                </Text>

                {/* E-mail */}
                <Text className="text-sm font-bold text-[#8754BF] text-center mt-1 mb-[15px]">
                  {email || "E-mail não informado"}
                </Text>

                <Text className="text-[13px] leading-5 text-[#64748B] text-center mb-[25px]">
                  Digite abaixo o código recebido para continuar a recuperação da sua senha.
                </Text>

                {/* Label */}
                <Text className="text-[15px] font-semibold text-[#52627B] mb-[9px]">
                  Código de recuperação
                </Text>

                {/* Campo do token */}
                <TextInput
                  className="h-[50px] border border-[#DDE6F5] rounded-[14px] px-[15px] text-sm text-[#263449] bg-white mb-[18px]"
                  placeholder="Digite seu token"
                  placeholderTextColor="#A7A7A7"
                  value={token}
                  onChangeText={(texto) => {
                    setToken(texto);
                    setErro("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="done"
                  onSubmitEditing={handleValidarToken}
                  accessibilityLabel="Código de recuperação"
                />

                {/* Erro */}
                {erro ? (
                  <Text
                    className="text-[#B91C1C] text-[13px] mb-3"
                    accessibilityRole="alert"
                  >
                    {erro}
                  </Text>
                ) : null}

                {/* Botão validar */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleValidarToken}
                  disabled={carregando}
                  className={`rounded-xl overflow-hidden ${
                    carregando ? "opacity-70" : ""
                  }`}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={["#A340C4", "#C15BDD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      minHeight: 49,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                    }}
                  >
                    {carregando ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-sm font-bold text-white">
                        Validar código
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Voltar */}
                <TouchableOpacity
                  className="items-center pt-5"
                  onPress={() => router.replace("/login")}
                  accessibilityRole="button"
                >
                  <Text className="text-[13px] font-semibold text-[#6F53B6]">
                    Voltar para o login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rodapé */}
            <Text className="text-xs leading-[18px] text-[#8B98AB] text-center">
              TamPets — juntos por um futuro melhor para os animais.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
