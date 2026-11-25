
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { redefinirSenha } from "@/services/authService";

export default function RedefinirSenha() {
  const router = useRouter();

  const { email, token } = useLocalSearchParams<{
    email: string;
    token: string;
  }>();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleRedefinirSenha() {
    if (carregando) return;

    if (!novaSenha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha os dois campos de senha.");
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert(
        "Senha inválida",
        "A senha deve possuir pelo menos 6 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Senhas diferentes", "As senhas não coincidem.");
      return;
    }

    if (!email || !token) {
      Alert.alert(
        "Erro",
        "As informações de recuperação não foram encontradas. Solicite um novo código."
      );
      router.replace("/login");
      return;
    }

    setCarregando(true);

    try {
      const resultado = await redefinirSenha(email, token, novaSenha);

      Alert.alert(
        "Senha redefinida!",
        resultado.message || "Sua senha foi alterada com sucesso.",
        [
          {
            text: "Ir para o login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (erro) {
      Alert.alert(
        "Erro",
        erro instanceof Error
          ? erro.message
          : "Não foi possível redefinir sua senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFE]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[450px] self-center px-6 py-10">

          {/* Ícone */}
          <View className="w-[76px] h-[76px] rounded-3xl bg-[#ECEBFF] items-center justify-center self-center mb-6">
            <Ionicons
              name="lock-closed-outline"
              size={36}
              color="#6C63FF"
            />
          </View>

          {/* Título */}
          <Text className="text-[28px] font-extrabold text-[#26334D] text-center mb-2">
            Nova senha
          </Text>

          <Text className="text-sm leading-5 text-[#7C8799] text-center px-2 mb-7">
            Escolha uma nova senha para acessar sua conta administrativa.
          </Text>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 border border-[#E9EDF5]">

            {/* Nova senha */}
            <Text className="text-[13px] font-bold text-[#34415B] mb-2 mt-2">
              Nova senha
            </Text>

            <View className="flex-row items-center h-[54px] px-3.5 gap-2.5 bg-[#FAFBFE] border border-[#E2E8F0] rounded-2xl mb-4">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8B95A7"
              />

              <TextInput
                className="flex-1 text-sm text-[#26334D]"
                placeholder="Digite sua nova senha"
                placeholderTextColor="#A0A9B8"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color="#8B95A7"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar senha */}
            <Text className="text-[13px] font-bold text-[#34415B] mb-2 mt-1">
              Confirmar nova senha
            </Text>

            <View className="flex-row items-center h-[54px] px-3.5 gap-2.5 bg-[#FAFBFE] border border-[#E2E8F0] rounded-2xl mb-4">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#8B95A7"
              />

              <TextInput
                className="flex-1 text-sm text-[#26334D]"
                placeholder="Digite novamente sua senha"
                placeholderTextColor="#A0A9B8"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!mostrarConfirmacao}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarConfirmacao
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color="#8B95A7"
                />
              </TouchableOpacity>
            </View>

            {/* Dica */}
            <Text className="text-xs text-[#8B95A7] mb-5">
              Utilize pelo menos 6 caracteres.
            </Text>

            {/* Botão */}
            <TouchableOpacity
              className={`h-[54px] rounded-2xl bg-[#6C63FF] flex-row items-center justify-center gap-2 mt-1 ${
                carregando ? "opacity-70" : ""
              }`}
              onPress={handleRedefinirSenha}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white text-[15px] font-bold">
                    Redefinir senha
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Voltar */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-6"
              onPress={() => router.replace("/login")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back-outline"
                size={18}
                color="#6C63FF"
              />

              <Text className="text-[13px] font-semibold text-[#6C63FF]">
                Voltar para o login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <Text className="text-center text-xs text-[#A0A9B8] mt-7">
            TamPets • Administração
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
