
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  listarAdministradores,
  cadastrarAdministrador,
  editarAdministrador,
} from "@/services/adminService";

type Admin = {
  idAdmin: number;
  username: string;
  emailUser: string;
};

export default function Credentials() {
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Admin | null>(null);

  const [username, setUsername] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [senha, setSenha] = useState("");

  const [administradores, setAdministradores] = useState<Admin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarAdministradores() {
    try {
      setCarregando(true);

      const dados = await listarAdministradores();

      setAdministradores(dados);
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro.message || "Não foi possível carregar os administradores."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAdministradores();
  }, []);

  const filtrados = administradores.filter((admin) => {
    const termo = busca.trim().toLowerCase();

    return (
      admin.username.toLowerCase().includes(termo) ||
      admin.emailUser.toLowerCase().includes(termo)
    );
  });

  function abrirCadastro() {
    setEditando(null);
    setUsername("");
    setEmailUser("");
    setSenha("");
    setModalVisible(true);
  }

  function abrirEdicao(admin: Admin) {
    setEditando(admin);
    setUsername(admin.username);
    setEmailUser(admin.emailUser);
    setSenha("");
    setModalVisible(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalVisible(false);
    setEditando(null);
    setUsername("");
    setEmailUser("");
    setSenha("");
  }

  async function salvar() {
    if (salvando) return;

    if (!username.trim() || !emailUser.trim()) {
      Alert.alert("Atenção", "Preencha o nome de usuário e o e-mail.");
      return;
    }

    if (!editando && !senha.trim()) {
      Alert.alert("Atenção", "Informe uma senha para o administrador.");
      return;
    }

    const duplicado = administradores.some(
      (admin) =>
        admin.username.toLowerCase() === username.trim().toLowerCase() &&
        admin.idAdmin !== editando?.idAdmin
    );

    if (duplicado) {
      Alert.alert("Atenção", "Esse nome de usuário já está cadastrado.");
      return;
    }

    try {
      setSalvando(true);

      if (editando) {
        await editarAdministrador(editando.idAdmin, {
          username: username.trim(),
          emailUser: emailUser.trim(),
        });

        await carregarAdministradores();

        Alert.alert(
          "Sucesso",
          "Administrador atualizado no banco de dados!"
        );
      } else {
        await cadastrarAdministrador({
          username: username.trim(),
          emailUser: emailUser.trim(),
          senha: senha.trim(),
        });

        await carregarAdministradores();

        Alert.alert(
          "Sucesso",
          "Administrador cadastrado no banco de dados!"
        );
      }

      setModalVisible(false);
      setEditando(null);
      setUsername("");
      setEmailUser("");
      setSenha("");
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro.message || "Não foi possível salvar o administrador."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFE]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-9 pb-12"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Cabeçalho */}
        <View className="mb-7 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-extrabold text-[#2D4F83]">
              Gerenciar credenciais
            </Text>

            <Text className="mt-2 text-sm text-slate-500">
              Controle de acesso administrativo
            </Text>
          </View>

          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
            <Ionicons
              name="shield-checkmark-outline"
              size={29}
              color="#8754BF"
            />
          </View>
        </View>

        {/* Busca */}
        <View className="mb-6 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
          <Ionicons name="search-outline" size={21} color="#64748B" />

          <TextInput
            className="ml-3 flex-1 py-4 text-base text-slate-800"
            placeholder="Buscar administrador..."
            placeholderTextColor="#94A3B8"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
          />
        </View>

        {/* Título da lista */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-slate-800">
            Administradores
          </Text>

          <View className="rounded-full bg-purple-100 px-3 py-1">
            <Text className="font-semibold text-purple-700">
              {filtrados.length}
            </Text>
          </View>
        </View>

        {/* Lista de administradores */}
        {!carregando &&
          filtrados.map((admin) => (
            <View
              key={admin.idAdmin}
              className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
            >
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Text className="text-xl font-bold text-purple-700">
                  {admin.username.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  className="text-base font-bold text-slate-800"
                  numberOfLines={1}
                >
                  {admin.username}
                </Text>

                <Text
                  className="mt-1 text-xs text-slate-500"
                  numberOfLines={1}
                >
                  {admin.emailUser}
                </Text>
              </View>

              <TouchableOpacity
                className="ml-3 rounded-xl bg-purple-50 p-3"
                onPress={() => abrirEdicao(admin)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${admin.username}`}
              >
                <Ionicons name="create-outline" size={22} color="#8754BF" />
              </TouchableOpacity>
            </View>
          ))}

        {/* Carregamento ou lista vazia */}
        {carregando ? (
          <View className="items-center rounded-2xl border border-slate-200 bg-white px-5 py-10">
            <Text className="text-slate-500">
              Carregando administradores...
            </Text>
          </View>
        ) : filtrados.length === 0 ? (
          <View className="items-center rounded-2xl border border-slate-200 bg-white px-5 py-10">
            <Ionicons name="search-outline" size={40} color="#94A3B8" />

            <Text className="mt-3 text-center text-slate-500">
              Nenhum administrador encontrado.
            </Text>
          </View>
        ) : null}

        {/* Novo administrador */}
        <TouchableOpacity
          className="mt-5 flex-row items-center justify-center rounded-2xl bg-[#8754BF] px-5 py-4"
          onPress={abrirCadastro}
          accessibilityRole="button"
        >
          <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />

          <Text className="ml-3 text-base font-bold text-white">
            Novo administrador
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de cadastro e edição */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-center bg-black/50 px-5"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow justify-center py-8"
          >
            <View className="rounded-3xl bg-white p-6">
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="flex-1 text-xl font-extrabold text-[#2D4F83]">
                  {editando ? "Editar administrador" : "Novo administrador"}
                </Text>

                <TouchableOpacity
                  onPress={fecharModal}
                  disabled={salvando}
                  accessibilityLabel="Fechar formulário"
                >
                  <Ionicons name="close-outline" size={27} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Nome de usuário */}
              <Text className="mb-2 font-semibold text-slate-700">
                Nome de usuário
              </Text>

              <TextInput
                className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800"
                placeholder="Digite o usuário"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* E-mail */}
              <Text className="mb-2 font-semibold text-slate-700">E-mail</Text>

              <TextInput
                className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800"
                placeholder="exemplo@email.com"
                value={emailUser}
                onChangeText={setEmailUser}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Senha - somente no cadastro */}
              {!editando && (
                <>
                  <Text className="mb-2 font-semibold text-slate-700">
                    Senha
                  </Text>

                  <TextInput
                    className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800"
                    placeholder="Digite uma senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}

              {/* Salvar */}
              <TouchableOpacity
                className={`mt-3 items-center rounded-xl bg-[#8754BF] py-4 ${
                  salvando ? "opacity-60" : ""
                }`}
                onPress={salvar}
                disabled={salvando}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-white">
                  {salvando
                    ? "Salvando..."
                    : editando
                    ? "Salvar alterações"
                    : "Cadastrar administrador"}
                </Text>
              </TouchableOpacity>

              {/* Cancelar */}
              <TouchableOpacity
                className="mt-3 items-center py-3"
                onPress={fecharModal}
                disabled={salvando}
              >
                <Text className="font-semibold text-slate-500">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
