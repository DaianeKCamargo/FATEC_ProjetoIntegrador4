
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import animalsService from "../../../services/animalsService";

type Animal = {
  id: string | number;
  data: string;
  tipoAnimal: string;
  quantidade: number;
};

const dataAtual = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const formatarData = (data: string) => {
  if (!data) return "";

  const parteData = data.substring(0, 10);
  const partes = parteData.split("-");

  if (partes.length !== 3) return parteData;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const normalizarTipo = (tipo: string) => {
  const valor = tipo?.trim().toLowerCase();

  if (valor === "gato" || valor === "gata" || valor === "gatos") {
    return "Gato";
  }

  if (
    valor === "cachorro" ||
    valor === "cachorra" ||
    valor === "cães" ||
    valor === "cao" ||
    valor === "cão" ||
    valor === "cachorros"
  ) {
    return "Cachorro";
  }

  return tipo;
};

const validarData = (data: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataVerificada = new Date(ano, mes - 1, dia);

  return (
    dataVerificada.getFullYear() === ano &&
    dataVerificada.getMonth() === mes - 1 &&
    dataVerificada.getDate() === dia
  );
};

export default function DashRegistration() {
  const [registros, setRegistros] = useState<Animal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [data, setData] = useState(dataAtual());
  const [tipoAnimal, setTipoAnimal] = useState("Gato");
  const [quantidade, setQuantidade] = useState("");

  const [editandoId, setEditandoId] = useState<string | number | null>(
    null
  );

  const [filtroMes, setFiltroMes] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const carregarRegistros = useCallback(async () => {
    try {
      const resposta = await animalsService.getAll();

      const dados = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.data)
          ? resposta.data
          : [];

      setRegistros(dados);
    } catch (erro) {
      console.error("Erro ao carregar registros:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível carregar os registros. Verifique a conexão com a API."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  const limparFormulario = () => {
    setData(dataAtual());
    setTipoAnimal("Gato");
    setQuantidade("");
    setEditandoId(null);
  };

  const salvarRegistro = async () => {
    if (!validarData(data)) {
      Alert.alert(
        "Data inválida",
        "Informe a data no formato AAAA-MM-DD, por exemplo, 2026-10-27."
      );
      return;
    }

    const quantidadeNumerica = Number(quantidade);

    if (
      !quantidade.trim() ||
      !Number.isInteger(quantidadeNumerica) ||
      quantidadeNumerica <= 0
    ) {
      Alert.alert(
        "Quantidade inválida",
        "Informe uma quantidade inteira maior que zero."
      );
      return;
    }

    if (!["Gato", "Cachorro"].includes(tipoAnimal)) {
      Alert.alert("Tipo inválido", "Selecione gato ou cachorro.");
      return;
    }

    const registro = {
      data,
      tipoAnimal,
      quantidade: quantidadeNumerica,
    };

    try {
      setSalvando(true);

      if (editandoId !== null) {
        await animalsService.update(String(editandoId), registro);
        Alert.alert("Sucesso", "Registro atualizado!");
      } else {
        await animalsService.create(registro);
        Alert.alert("Sucesso", "Registro cadastrado!");
      }

      limparFormulario();
      await carregarRegistros();
    } catch (erro) {
      console.error("Erro ao salvar registro:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível salvar o registro. Confira se a API está funcionando."
      );
    } finally {
      setSalvando(false);
    }
  };

  const editarRegistro = (registro: Animal) => {
    setData(String(registro.data).substring(0, 10));
    setTipoAnimal(normalizarTipo(registro.tipoAnimal));
    setQuantidade(String(registro.quantidade));
    setEditandoId(registro.id);
  };

  const excluirRegistro = (registro: Animal) => {
    Alert.alert(
      "Excluir registro",
      "Deseja realmente excluir este registro?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await animalsService.remove(String(registro.id));
              await carregarRegistros();

              Alert.alert("Sucesso", "Registro excluído.");
            } catch (erro) {
              console.error("Erro ao excluir registro:", erro);
              Alert.alert("Erro", "Não foi possível excluir o registro.");
            }
          },
        },
      ]
    );
  };

  const registrosFiltrados = useMemo(() => {
    return registros.filter((registro) => {
      const dataRegistro = String(registro.data ?? "").substring(0, 10);
      const tipo = normalizarTipo(registro.tipoAnimal ?? "");

      const correspondeAoMes =
        !filtroMes || dataRegistro.startsWith(filtroMes);

      const correspondeAoTipo =
        filtroTipo === "Todos" || tipo === filtroTipo;

      return correspondeAoMes && correspondeAoTipo;
    });
  }, [registros, filtroMes, filtroTipo]);

  const totalGatos = registrosFiltrados
    .filter((registro) => normalizarTipo(registro.tipoAnimal) === "Gato")
    .reduce((total, registro) => total + Number(registro.quantidade || 0), 0);

  const totalCachorros = registrosFiltrados
    .filter(
      (registro) => normalizarTipo(registro.tipoAnimal) === "Cachorro"
    )
    .reduce((total, registro) => total + Number(registro.quantidade || 0), 0);

  const totalCastrações = totalGatos + totalCachorros;

  const selecionarTipo = (tipo: string) => {
    setTipoAnimal(tipo);
  };

  return (
    <View className="flex-1 bg-[#edf6ff]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarRegistros();
            }}
            tintColor="#c5a51a"
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-[#25324b]">
            Registros de castração
          </Text>

          <Text className="mt-2 text-sm text-[#666666]">
            Gerencie os registros de castração dos animais.
          </Text>
        </View>

        {/* Indicadores */}
        <View className="mb-6 gap-3">
          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="mr-3 rounded-xl bg-[#fff5c7] p-3">
                <Ionicons name="paw" size={24} color="#b49a17" />
              </View>

              <View className="flex-1">
                <Text className="text-sm text-[#666666]">
                  Total de castrações
                </Text>

                <Text className="mt-1 text-2xl font-bold text-[#25324b]">
                  {totalCastrações}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="logo-octocat" size={23} color="#5f81b7" />

              <Text className="mt-3 text-sm text-[#666666]">Gatos</Text>

              <Text className="mt-1 text-xl font-bold text-[#25324b]">
                {totalGatos}
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="paw-outline" size={23} color="#5f81b7" />

              <Text className="mt-3 text-sm text-[#666666]">
                Cachorros
              </Text>

              <Text className="mt-1 text-xl font-bold text-[#25324b]">
                {totalCachorros}
              </Text>
            </View>
          </View>
        </View>

        {/* Formulário */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-1 text-lg font-bold text-[#25324b]">
            {editandoId !== null ? "Editar registro" : "Novo registro"}
          </Text>

          <Text className="mb-5 text-sm text-[#666666]">
            Preencha os dados da castração.
          </Text>

          <Text className="mb-2 font-semibold text-[#25324b]">
            Data
          </Text>

          <TextInput
            value={data}
            onChangeText={setData}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#999999"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            className="mb-4 rounded-xl border border-[#dce4ee] bg-white px-4 py-3 text-[#25324b]"
          />

          <Text className="mb-2 font-semibold text-[#25324b]">
            Tipo de animal
          </Text>

          <View className="mb-4 flex-row gap-3">
            {["Gato", "Cachorro"].map((tipo) => {
              const selecionado = tipoAnimal === tipo;

              return (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => selecionarTipo(tipo)}
                  className={`flex-1 items-center rounded-xl border px-3 py-3 ${
                    selecionado
                      ? "border-[#c5a51a] bg-[#fff7d6]"
                      : "border-[#dce4ee] bg-white"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selecionado ? "text-[#8e7610]" : "text-[#666666]"
                    }`}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="mb-2 font-semibold text-[#25324b]">
            Quantidade
          </Text>

          <TextInput
            value={quantidade}
            onChangeText={setQuantidade}
            placeholder="Digite a quantidade"
            placeholderTextColor="#999999"
            keyboardType="numeric"
            className="mb-5 rounded-xl border border-[#dce4ee] bg-white px-4 py-3 text-[#25324b]"
          />

          <TouchableOpacity
            onPress={salvarRegistro}
            disabled={salvando}
            className={`items-center rounded-xl py-4 ${
              salvando ? "bg-[#b9a94c]" : "bg-[#c5a51a]"
            }`}
          >
            {salvando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-bold text-white">
                {editandoId !== null
                  ? "Salvar alterações"
                  : "Cadastrar registro"}
              </Text>
            )}
          </TouchableOpacity>

          {editandoId !== null && (
            <TouchableOpacity
              onPress={limparFormulario}
              className="mt-3 items-center rounded-xl border border-[#dce4ee] py-3"
            >
              <Text className="font-semibold text-[#666666]">
                Cancelar edição
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de registros */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-[#25324b]">
            Registros cadastrados
          </Text>

          <Text className="mt-1 text-sm text-[#666666]">
            Consulte, filtre, edite ou exclua os registros.
          </Text>
        </View>

        {/* Filtros */}
        <View className="mb-4 rounded-2xl bg-white p-4">
          <Text className="mb-2 font-semibold text-[#25324b]">
            Filtrar por mês
          </Text>

          <TextInput
            value={filtroMes}
            onChangeText={setFiltroMes}
            placeholder="AAAA-MM (ex.: 2026-10)"
            placeholderTextColor="#999999"
            maxLength={7}
            className="mb-4 rounded-xl border border-[#dce4ee] px-3 py-3 text-[#25324b]"
          />

          <Text className="mb-2 font-semibold text-[#25324b]">
            Tipo de animal
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {["Todos", "Gato", "Cachorro"].map((tipo) => {
              const selecionado = filtroTipo === tipo;

              return (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => setFiltroTipo(tipo)}
                  className={`rounded-full border px-4 py-2 ${
                    selecionado
                      ? "border-[#5f81b7] bg-[#5f81b7]"
                      : "border-[#dce4ee] bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selecionado ? "text-white" : "text-[#666666]"
                    }`}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!filtroMes && !/^\d{4}-\d{2}$/.test(filtroMes) && (
            <Text className="mt-2 text-xs text-red-600">
              Digite o mês no formato AAAA-MM.
            </Text>
          )}

          <TouchableOpacity
            onPress={() => {
              setFiltroMes("");
              setFiltroTipo("Todos");
            }}
            className="mt-3 self-start py-2"
          >
            <Text className="font-semibold text-[#5f81b7]">
              Limpar filtros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo da listagem */}
        {carregando ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#c5a51a" />
            <Text className="mt-3 text-[#666666]">
              Carregando registros...
            </Text>
          </View>
        ) : registrosFiltrados.length === 0 ? (
          <View className="items-center rounded-2xl bg-white px-5 py-10">
            <Ionicons
              name="document-text-outline"
              size={38}
              color="#5f81b7"
            />

            <Text className="mt-3 text-center font-bold text-[#25324b]">
              Nenhum registro encontrado
            </Text>

            <Text className="mt-2 text-center text-sm text-[#666666]">
              Os registros aparecerão aqui quando forem cadastrados.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {registrosFiltrados.map((registro, indice) => (
              <View
                key={String(registro.id ?? indice)}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-[#25324b]">
                      {normalizarTipo(registro.tipoAnimal)}
                    </Text>

                    <Text className="mt-1 text-sm text-[#666666]">
                      Data: {formatarData(String(registro.data))}
                    </Text>
                  </View>

                  <View className="rounded-xl bg-[#fff5c7] px-3 py-2">
                    <Text className="font-bold text-[#8e7610]">
                      {registro.quantidade}{" "}
                      {Number(registro.quantidade) === 1
                        ? "animal"
                        : "animais"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 border-t border-[#edf0f5] pt-3">
                  <TouchableOpacity
                    onPress={() => editarRegistro(registro)}
                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#5f81b7] py-3"
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#ffffff"
                    />

                    <Text className="ml-2 font-semibold text-white">
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => excluirRegistro(registro)}
                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#c94c4c] py-3"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#ffffff"
                    />

                    <Text className="ml-2 font-semibold text-white">
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
