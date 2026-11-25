import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { verificarSessao } from "@/services/authService";

export default function AdminLayout() {
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "authorized" | "error">(
    "loading"
  );

  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    async function validarAcesso() {
      try {
        const autenticado = await verificarSessao();

        if (!autenticado) {
          router.replace("/login");
          return;
        }

        setStatus("authorized");
      } catch (error) {
        console.log("Erro ao verificar sessão:", error);
        setStatus("error");
      }
    }

    validarAcesso();
  }, [tentativa]);

  // Enquanto verifica a sessão
  if (status === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFE]" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8754BF" />

          <Text className="mt-4 text-sm text-slate-500">
            Verificando sua sessão...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Se houve erro de conexão
  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFE]" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl font-bold text-[#2D4F83]">
            Não foi possível verificar sua sessão
          </Text>

          <Text className="mt-3 text-center text-sm text-slate-500">
            Verifique sua conexão com a internet e tente novamente.
          </Text>

          <TouchableOpacity
            onPress={() => {
              setStatus("loading");
              setTentativa((t) => t + 1);
           }}
            className="mt-6 rounded-xl bg-[#8754BF] px-6 py-3"
          >
            <Text className="font-bold text-white">Tentar novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/login")}
            className="mt-4"
          >
            <Text className="font-semibold text-[#8754BF]">
              Voltar para o login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Somente usuários autenticados acessam as páginas administrativas
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFE]" edges={["top"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#F8FAFE",
          },
        }}
      />
    </SafeAreaView>
  );
}