
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { removerToken } from "@/services/authService";
import animalsService, { Animal } from "@/services/animalService";
import capsService, { RegistroCapsAPI } from "@/services/capsService";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const ANO_ATUAL = new Date().getFullYear();

const ANOS = Array.from(
  { length: 7 },
  (_, i) => ANO_ATUAL - 5 + i
);

type TipoFiltro = "mes" | "ano" | null;

function normalizarTipoAnimal(tipo: string) {
  const valor = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (
    ["gato", "gatos", "felino", "felinos"].includes(valor)
  ) {
    return "gato";
  }

  if (
    [
      "cao",
      "caes",
      "cachorro",
      "cachorros",
      "canino",
      "caninos",
      "dog",
      "dogs",
    ].includes(valor)
  ) {
    return "cachorro";
  }

  return valor;
}

// Converte a data sem causar problemas de fuso horário
function obterMesEAno(data: string) {
  const valor = String(data).substring(0, 10);
  const partes = valor.split("-");

  if (partes.length === 3) {
    const ano = Number(partes[0]);
    const mes = Number(partes[1]);

    if (!isNaN(ano) && !isNaN(mes)) {
      return { ano, mes: mes - 1 };
    }
  }

  const dataConvertida = new Date(data);

  if (isNaN(dataConvertida.getTime())) {
    return null;
  }

  return {
    ano: dataConvertida.getFullYear(),
    mes: dataConvertida.getMonth(),
  };
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-white rounded-3xl p-5 ${className}`}>
      {children}
    </View>
  );
}

export default function Home() {
  const router = useRouter();

  const [animais, setAnimais] = useState<Animal[]>([]);
  const [registrosCaps, setRegistrosCaps] = useState<RegistroCapsAPI[]>([]);

  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth()
  );

  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );

  const [filtroAberto, setFiltroAberto] = useState<TipoFiltro>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Busca os dados das APIs
  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [dadosAnimais, dadosCaps] = await Promise.all([
        animalsService.getAll(),
        capsService.listarRegistros(),
      ]);

      setAnimais(Array.isArray(dadosAnimais) ? dadosAnimais : []);
      setRegistrosCaps(Array.isArray(dadosCaps) ? dadosCaps : []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtra os animais pelo mês e ano selecionados
  const animaisFiltrados = useMemo(() => {
    return animais.filter((animal) => {
      const periodo = obterMesEAno(animal.data);

      if (!periodo) return false;

      return (
        periodo.mes === mesSelecionado &&
        periodo.ano === anoSelecionado
      );
    });
  }, [animais, mesSelecionado, anoSelecionado]);

  // Filtra as tampinhas pelo mês e ano selecionados
  const capsFiltradas = useMemo(() => {
    return registrosCaps.filter((registro) => {
      const periodo = obterMesEAno(registro.data);

      if (!periodo) return false;

      return (
        periodo.mes === mesSelecionado &&
        periodo.ano === anoSelecionado
      );
    });
  }, [registrosCaps, mesSelecionado, anoSelecionado]);

  // Soma os registros de cães
  const totalCaes = useMemo(() => {
    return animaisFiltrados.reduce((total, animal) => {
      if (normalizarTipoAnimal(animal.tipoAnimal) === "cachorro") {
        return total + Number(animal.quantidade || 0);
      }

      return total;
    }, 0);
  }, [animaisFiltrados]);

  // Soma os registros de gatos
  const totalGatos = useMemo(() => {
    return animaisFiltrados.reduce((total, animal) => {
      if (normalizarTipoAnimal(animal.tipoAnimal) === "gato") {
        return total + Number(animal.quantidade || 0);
      }

      return total;
    }, 0);
  }, [animaisFiltrados]);

  // Total de animais castrados
  const totalAnimais = totalCaes + totalGatos;

  // Soma os kg de tampinhas
  const totalCapsKg = useMemo(() => {
    return capsFiltradas.reduce((total, registro) => {
      return total + Number(registro.quantidade_kg || 0);
    }, 0);
  }, [capsFiltradas]);

  // Logout
  function confirmarLogout() {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await removerToken();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  }

  function formatarNumero(numero: number) {
    return numero.toLocaleString("pt-BR");
  }

  function formatarKg(numero: number) {
    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return (
    <View className="flex-1 bg-[#F8FAFE]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 35 }}
      >
        {/* HEADER */}
        <View className="px-6 pt-5 pb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-[#EDE7FF] rounded-2xl p-3 mr-3">
              <Ionicons
                name="paw"
                size={27}
                color="#7554D8"
              />
            </View>

            <View>
              <Text className="text-[#7554D8] text-xl font-extrabold">
                TamPets
              </Text>

              <Text className="text-gray-500 text-xs">
                Painel administrativo
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={confirmarLogout}
            className="bg-white p-3 rounded-xl"
          >
            <Ionicons
              name="log-out-outline"
              size={23}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* TÍTULO */}
        <View className="px-6 mb-5">
          <Text className="text-2xl font-extrabold text-gray-800">
            Resumo geral
          </Text>

          <Text className="text-gray-500 mt-1">
            Acompanhe os resultados do TamPets
          </Text>
        </View>

        {/* FILTROS */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setFiltroAberto("mes")}
              className="flex-1 bg-white rounded-2xl px-4 py-4 flex-row items-center justify-between border border-gray-100"
            >
              <View>
                <Text className="text-gray-400 text-xs mb-1">
                  Mês
                </Text>

                <Text className="text-gray-800 font-bold">
                  {MESES[mesSelecionado]}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={18}
                color="#7554D8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFiltroAberto("ano")}
              className="flex-1 bg-white rounded-2xl px-4 py-4 flex-row items-center justify-between border border-gray-100"
            >
              <View>
                <Text className="text-gray-400 text-xs mb-1">
                  Ano
                </Text>

                <Text className="text-gray-800 font-bold">
                  {anoSelecionado}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={18}
                color="#7554D8"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOADING */}
        {carregando ? (
          <View className="py-16 items-center">
            <ActivityIndicator
              size="large"
              color="#7554D8"
            />

            <Text className="text-gray-500 mt-4">
              Carregando dados...
            </Text>
          </View>
        ) : erro ? (
          /* ERRO */
          <View className="mx-6 bg-red-50 rounded-2xl p-5">
            <Ionicons
              name="alert-circle-outline"
              size={30}
              color="#DC2626"
            />

            <Text className="text-red-600 font-bold mt-2">
              Não foi possível carregar o dashboard
            </Text>

            <Text className="text-red-500 text-sm mt-1">
              {erro}
            </Text>

            <TouchableOpacity
              onPress={carregarDados}
              className="bg-red-100 rounded-xl px-4 py-3 mt-4 self-start"
            >
              <Text className="text-red-700 font-bold">
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ANIMAIS CASTRADOS */}
            <View className="px-6 mb-4">
              <View className="bg-[#7554D8] rounded-3xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-purple-100 text-sm font-semibold">
                    ANIMAIS CASTRADOS
                  </Text>

                  <Ionicons
                    name="heart"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>

                <Text className="text-white text-5xl font-extrabold">
                  {formatarNumero(totalAnimais)}
                </Text>

                <Text className="text-purple-100 mt-2">
                  Animais atendidos no período
                </Text>
              </View>
            </View>

            {/* TAMPINHAS */}
            <View className="px-6 mb-4">
              <Card>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-sm font-semibold">
                      TAMPINHAS ARRECADADAS
                    </Text>

                    <Text className="text-gray-800 text-3xl font-extrabold mt-2">
                      {formatarKg(totalCapsKg)} kg
                    </Text>

                    <Text className="text-gray-400 text-xs mt-2">
                      Total arrecadado no período
                    </Text>
                  </View>

                  <View className="bg-[#E0F2FE] p-4 rounded-2xl">
                    <Ionicons
                      name="leaf"
                      size={30}
                      color="#0284C7"
                    />
                  </View>
                </View>
              </Card>
            </View>

            {/* CÃES E GATOS */}
            <View className="px-6 flex-row gap-3 mb-4">
              <View className="flex-1 bg-white rounded-3xl p-5">
                <View className="bg-[#FCE7F3] rounded-2xl p-3 self-start mb-3">
                  <Ionicons
                    name="paw"
                    size={24}
                    color="#DB2777"
                  />
                </View>

                <Text className="text-gray-500 text-sm">
                  Cachorros
                </Text>

                <Text className="text-gray-800 text-3xl font-extrabold mt-1">
                  {formatarNumero(totalCaes)}
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-3xl p-5">
                <View className="bg-[#DCFCE7] rounded-2xl p-3 self-start mb-3">
                  <Ionicons
                    name="paw"
                    size={24}
                    color="#16A34A"
                  />
                </View>

                <Text className="text-gray-500 text-sm">
                  Gatos
                </Text>

                <Text className="text-gray-800 text-3xl font-extrabold mt-1">
                  {formatarNumero(totalGatos)}
                </Text>
              </View>
            </View>

            {/* PONTOS DE COLETA */}
            <View className="px-6 mb-4">
              <Card>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-sm font-semibold">
                      PONTOS DE COLETA
                    </Text>

                    <Text className="text-gray-800 text-3xl font-extrabold mt-2">
                      18
                    </Text>

                    <Text className="text-gray-400 text-xs mt-1">
                      Pontos parceiros
                    </Text>
                  </View>

                  <View className="bg-[#FFF7D6] p-4 rounded-2xl">
                    <Ionicons
                      name="location"
                      size={30}
                      color="#CA8A04"
                    />
                  </View>
                </View>
              </Card>
            </View>

            {/* RODAPÉ */}
            <View className="px-6 mt-3">
              <Text className="text-gray-400 text-xs text-center">
                Exibindo dados de {MESES[mesSelecionado]} de{" "}
                {anoSelecionado}
              </Text>

              <Text className="text-gray-400 text-xs text-center mt-2">
                TamPets • Juntos por uma causa
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL DE FILTROS */}
      <Modal
        visible={filtroAberto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltroAberto(null)}
      >
        <View className="flex-1 justify-center bg-black/40 px-6">
          <View className="bg-white rounded-3xl p-5 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-800 text-xl font-extrabold">
                {filtroAberto === "mes"
                  ? "Selecionar mês"
                  : "Selecionar ano"}
              </Text>

              <TouchableOpacity
                onPress={() => setFiltroAberto(null)}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filtroAberto === "mes" &&
                MESES.map((mes, index) => (
                  <TouchableOpacity
                    key={mes}
                    onPress={() => {
                      setMesSelecionado(index);
                      setFiltroAberto(null);
                    }}
                    className={`px-4 py-4 rounded-xl mb-1 ${
                      mesSelecionado === index
                        ? "bg-[#EDE7FF]"
                        : "bg-white"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        mesSelecionado === index
                          ? "text-[#7554D8]"
                          : "text-gray-700"
                      }`}
                    >
                      {mes}
                    </Text>
                  </TouchableOpacity>
                ))}

              {filtroAberto === "ano" &&
                ANOS.map((ano) => (
                  <TouchableOpacity
                    key={ano}
                    onPress={() => {
                      setAnoSelecionado(ano);
                      setFiltroAberto(null);
                    }}
                    className={`px-4 py-4 rounded-xl mb-1 ${
                      anoSelecionado === ano
                        ? "bg-[#EDE7FF]"
                        : "bg-white"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        anoSelecionado === ano
                          ? "text-[#7554D8]"
                          : "text-gray-700"
                      }`}
                    >
                      {ano}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
