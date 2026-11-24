
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { removerToken } from "@/services/authService";

export default function Home() {
  const router = useRouter();

  // Dados fictícios para demonstração
  const dados = {
    animaisAuxiliados: 248,
    tampinhasKg: 1850,
    caes: 156,
    gatos: 92,
    pontosColeta: 18,
  };

  async function handleLogout() {
    Alert.alert(
      "Sair da conta",
      "Deseja realmente sair do painel administrativo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await removerToken();
              router.replace("/(auth)/login");
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível encerrar sua sessão."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFE]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-8 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View className="mb-7 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
              <Ionicons
                name="paw"
                size={25}
                color="#8754BF"
              />
            </View>

            <View>
              <Text className="text-xl font-extrabold text-[#2D4F83]">
                TamPets
              </Text>

              <Text className="text-[10px] font-semibold tracking-widest text-slate-400">
                PAINEL ADMINISTRATIVO
              </Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5"
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#8B647A"
            />

            <Text className="ml-2 text-sm font-semibold text-[#8B647A]">
              Sair
            </Text>
          </TouchableOpacity>
        </View>

        {/* Título */}
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-[#2D4F83]">
            Resumo geral
          </Text>

          <Text className="mt-1 text-sm text-slate-500">
            Acompanhe os resultados do nosso projeto.
          </Text>
        </View>

        {/* Animais auxiliados */}
        <View className="mb-4 rounded-3xl bg-[#8754BF] p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold tracking-wider text-purple-100">
              ANIMAIS AUXILIADOS
            </Text>

            <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Ionicons
                name="paw"
                size={25}
                color="#FFFFFF"
              />
            </View>
          </View>

          <Text className="mt-3 text-5xl font-extrabold text-white">
            {dados.animaisAuxiliados}
          </Text>

          <Text className="mt-2 text-sm text-purple-100">
            Vidas impactadas pelo projeto 💜
          </Text>
        </View>

        {/* Tampinhas */}
        <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
              <Ionicons
                name="leaf-outline"
                size={26}
                color="#16A34A"
              />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-sm text-slate-500">
                Tampinhas arrecadadas
              </Text>

              <Text className="mt-1 text-3xl font-extrabold text-[#2D4F83]">
                {dados.tampinhasKg.toLocaleString("pt-BR")} kg
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-xl bg-green-50 p-3">
            <Text className="text-xs leading-5 text-green-700">
              ♻️ Cada tampinha ajuda a transformar vidas.
            </Text>
          </View>
        </View>

        {/* Animais */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-[#2D4F83]">
            Animais auxiliados
          </Text>
        </View>

        <View className="mb-5 flex-row gap-3">
          {/* Cães */}
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="mb-3 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Ionicons
                  name="paw-outline"
                  size={22}
                  color="#5285C8"
                />
              </View>

              <Text className="ml-2 text-sm font-medium text-slate-500">
                Cães
              </Text>
            </View>

            <Text className="text-3xl font-extrabold text-[#263449]">
              {dados.caes}
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
              Auxiliados
            </Text>
          </View>

          {/* Gatos */}
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="mb-3 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color="#DB5C94"
                />
              </View>

              <Text className="ml-2 text-sm font-medium text-slate-500">
                Gatos
              </Text>
            </View>

            <Text className="text-3xl font-extrabold text-[#263449]">
              {dados.gatos}
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
              Auxiliados
            </Text>
          </View>
        </View>

        {/* Pontos de coleta */}
        <View className="mb-6 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
            <Ionicons
              name="location-outline"
              size={25}
              color="#EA580C"
            />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-sm text-slate-500">
              Pontos de coleta
            </Text>

            <Text className="mt-1 text-xl font-extrabold text-[#263449]">
              {dados.pontosColeta} pontos
            </Text>
          </View>
        </View>

        {/* Rodapé */}
        <View className="items-center rounded-2xl bg-purple-50 px-5 py-5">
          <Ionicons
            name="heart"
            size={23}
            color="#8754BF"
          />

          <Text className="mt-2 text-center text-sm font-bold text-[#8754BF]">
            Pequenas ações, grandes transformações!
          </Text>

          <Text className="mt-2 text-center text-xs text-slate-400">
            TamPets Sorocaba • Projeto Integrador
          </Text>
        </View>

        {/* Aviso de dados */}
        <Text className="mt-4 text-center text-[10px] text-slate-400">
          Dados ilustrativos para demonstração.
        </Text>
      </ScrollView>
    </View>
  );
}
