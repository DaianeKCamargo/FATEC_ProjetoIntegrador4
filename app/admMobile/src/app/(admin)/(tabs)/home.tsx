
import React from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  // Dados fictícios para demonstração
  const dados = {
    animaisAuxiliados: 248,
    tampinhasKg: 1850,
    caes: 156,
    gatos: 92,
    pontosColeta: 18,
  };

  return (
    <View className="flex-1 bg-[#F8FAFE]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-10 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View className="mb-7">
          <Text className="text-sm font-semibold text-[#8754BF]">
            TAMPETS • PAINEL ADMINISTRATIVO
          </Text>

          <Text className="mt-2 text-3xl font-extrabold text-[#2D4F83]">
            Visão geral 🐾
          </Text>

          <Text className="mt-2 text-sm text-slate-500">
            Acompanhe o impacto das arrecadações
            e dos animais auxiliados.
          </Text>
        </View>

        {/* Card principal */}
        <View className="mb-5 rounded-3xl bg-[#8754BF] p-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-purple-100">
                Animais auxiliados
              </Text>

              <Text className="mt-3 text-5xl font-extrabold text-white">
                {dados.animaisAuxiliados}
              </Text>

              <Text className="mt-3 text-sm text-purple-100">
                Vidas impactadas pelo projeto 💜
              </Text>
            </View>

            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <Ionicons
                name="paw"
                size={35}
                color="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Tampinhas */}
        <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <Ionicons
                name="leaf-outline"
                size={30}
                color="#16A34A"
              />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-sm text-slate-500">
                Tampinhas arrecadadas
              </Text>

              <Text className="mt-1 text-3xl font-extrabold text-[#2D4F83]">
                {dados.tampinhasKg.toLocaleString("pt-BR")} kg
              </Text>
            </View>
          </View>

          <View className="mt-5 rounded-xl bg-green-50 p-3">
            <Text className="text-sm text-green-700">
              ♻️ Cada tampinha contribui para
              transformar a vida de um animal!
            </Text>
          </View>
        </View>

        {/* Resumo */}
        <Text className="mb-4 text-xl font-bold text-[#2D4F83]">
          Resumo do projeto
        </Text>

        <View className="mb-4 flex-row gap-3">
          {/* Cães */}
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Ionicons
                name="paw-outline"
                size={24}
                color="#2563EB"
              />
            </View>

            <Text className="text-3xl font-extrabold text-slate-800">
              {dados.caes}
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Cães auxiliados
            </Text>
          </View>

          {/* Gatos */}
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-pink-100">
              <Ionicons
                name="heart-outline"
                size={24}
                color="#DB2777"
              />
            </View>

            <Text className="text-3xl font-extrabold text-slate-800">
              {dados.gatos}
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Gatos auxiliados
            </Text>
          </View>
        </View>

        {/* Pontos de coleta */}
        <View className="mb-6 flex-row items-center rounded-2xl border border-slate-200 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
            <Ionicons
              name="location-outline"
              size={27}
              color="#EA580C"
            />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-sm text-slate-500">
              Pontos de coleta
            </Text>

            <Text className="text-2xl font-extrabold text-slate-800">
              {dados.pontosColeta}
            </Text>
          </View>
        </View>

        {/* Rodapé */}
        <View className="items-center rounded-2xl bg-purple-50 p-5">
          <Ionicons
            name="heart"
            size={25}
            color="#8754BF"
          />

          <Text className="mt-2 text-center text-base font-bold text-[#8754BF]">
            Pequenas ações, grandes transformações!
          </Text>

          <Text className="mt-2 text-center text-xs text-slate-500">
            TamPets Sorocaba • Projeto Integrador
          </Text>
        </View>

        <Text className="mt-5 text-center text-xs text-slate-400">
          Dados ilustrativos para demonstração.
        </Text>
      </ScrollView>
    </View>
  );
}
