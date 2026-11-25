
import { useRouter } from "expo-router";
import {
  realizarLogin,
  salvarToken,
  solicitarRecuperacao,
} from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 800;

  const [activeTab, setActiveTab] = useState<"login" | "recuperar">("login");

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [tecladoAberto, setTecladoAberto] = useState(false);

  // Detecta quando o teclado abre e fecha
  useEffect(() => {
    const eventoMostrar =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const eventoEsconder =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const mostrar = Keyboard.addListener(eventoMostrar, () => {
      setTecladoAberto(true);
    });

    const esconder = Keyboard.addListener(eventoEsconder, () => {
      setTecladoAberto(false);
    });

    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  async function handleSubmit() {
    if (carregando) return;

    // RECUPERAÇÃO DE SENHA
    if (activeTab === "recuperar") {
      if (!email.trim()) {
        setErroLogin("Informe seu e-mail.");
        return;
      }

      setCarregando(true);
      setErroLogin("");

      try {
        await solicitarRecuperacao(email);

        Keyboard.dismiss();

        router.push({
          pathname: "/(auth)/validar-token",
          params: {
            email: email.trim().toLowerCase(),
          },
        });
      } catch (erro) {
        setErroLogin(
          erro instanceof Error
            ? erro.message
            : "Não foi possível solicitar a recuperação de senha."
        );
      } finally {
        setCarregando(false);
      }

      return;
    }

    // LOGIN
    if (!usuario.trim() || !senha) {
      setErroLogin("Preencha seu usuário e sua senha.");
      return;
    }

    setCarregando(true);
    setErroLogin("");

    try {
      const resultado = await realizarLogin(usuario.trim(), senha);

      await salvarToken(resultado.token);

      Keyboard.dismiss();
      setSenha("");

      router.replace("/(admin)/(tabs)/home");
    } catch (erro) {
      setErroLogin(
        erro instanceof Error
          ? erro.message
          : "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFE] overflow-hidden">
      {/* DECORAÇÃO DO FUNDO */}
      {!tecladoAberto && (
        <>
          <View
            pointerEvents="none"
            className="absolute top-6 left-5 right-5 flex-row justify-around opacity-30"
          >
            <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
            <View className="w-[13px] h-[13px] rounded-full bg-[#E1D9FA]" />
            <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
          </View>

          <View
            pointerEvents="none"
            className="absolute bottom-7 left-5 right-5 flex-row justify-around opacity-25"
          >
            <View className="w-[13px] h-[13px] rounded-full bg-[#E1D9FA]" />
            <View className="w-[34px] h-[34px] rounded-full border border-[#DCE3FA] bg-[#E9E9FC]" />
          </View>
        </>
      )}

      {/* AJUSTE DO TECLADO */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: tecladoAberto ? "flex-start" : "center",
            paddingHorizontal: isWideScreen ? 40 : 22,
            paddingTop: tecladoAberto ? 12 : isWideScreen ? 48 : 36,
            paddingBottom: tecladoAberto ? 20 : isWideScreen ? 48 : 36,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View
            className={`w-full self-center gap-7 ${
              isWideScreen
                ? "max-w-[1280px] flex-row items-center justify-center"
                : "max-w-[520px]"
            }`}
          >
            {/* PAINEL DE BOAS-VINDAS */}
            {!tecladoAberto && (
              <View
                className={`bg-white/[0.94] rounded-[30px] border border-[#E0E8F7] overflow-hidden flex-row ${
                  isWideScreen
                    ? "flex-1 max-w-[680px] min-h-[390px]"
                    : "min-h-[270px]"
                }`}
              >
                <LinearGradient
                  colors={["#587DBB", "#C15BDD"]}
                  style={{ width: 9 }}
                />

                <View className="flex-1 items-center justify-center px-6 py-9">
                  <Text className="text-[19px] font-semibold text-[#263449] text-center mb-[22px]">
                    Seja Bem-Vindo!
                  </Text>

                  <Text
                    className={`font-black text-[#2D4F83] text-center ${
                      isWideScreen
                        ? "text-[34px] leading-[42px]"
                        : "text-[30px] leading-[37px]"
                    }`}
                  >
                    O progresso de hoje constrói a conquista de amanhã.
                  </Text>

                  <Text className="mt-[18px] text-[13px] leading-5 text-[#64748B] text-center">
                    TamPets — juntos por um futuro melhor para os animais.
                  </Text>
                </View>
              </View>
            )}

            {/* PAINEL DE LOGIN */}
            <View
              className={`bg-white rounded-[32px] px-6 py-7 ${
                isWideScreen
                  ? "flex-1 max-w-[520px] px-[30px] py-[30px]"
                  : "w-full"
              }`}
            >
              {/* ABAS */}
              <View className="flex-row items-center bg-[#EDF1F7] p-[5px] rounded-full mb-[18px]">
                <TouchableOpacity
                  className={`flex-1 min-h-[44px] justify-center items-center rounded-full px-1 ${
                    activeTab === "login" ? "bg-[#719EDB]" : ""
                  }`}
                  onPress={() => {
                    setActiveTab("login");
                    setErroLogin("");
                    Keyboard.dismiss();
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === "login",
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-[13px] text-center font-semibold ${
                      activeTab === "login"
                        ? "text-white font-extrabold"
                        : "text-[#52627B]"
                    }`}
                  >
                    Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 min-h-[44px] justify-center items-center rounded-full px-1 ${
                    activeTab === "recuperar" ? "bg-[#719EDB]" : ""
                  }`}
                  onPress={() => {
                    setActiveTab("recuperar");
                    setErroLogin("");
                    Keyboard.dismiss();
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === "recuperar",
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-[13px] text-center font-semibold ${
                      activeTab === "recuperar"
                        ? "text-white font-extrabold"
                        : "text-[#52627B]"
                    }`}
                  >
                    Recuperar Senha
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FORMULÁRIO DE LOGIN */}
              {activeTab === "login" ? (
                <>
                  {/* USUÁRIO */}
                  <Text className="text-[15px] font-semibold text-[#52627B] mb-[9px] mt-[1px]">
                    Usuário
                  </Text>

                  <TextInput
                    className="h-[47px] border border-[#DDE6F5] rounded-[14px] px-[13px] text-sm text-[#263449] bg-white mb-5"
                    placeholder="Digite seu usuário"
                    placeholderTextColor="#A7A7A7"
                    value={usuario}
                    onChangeText={setUsuario}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    accessibilityLabel="Usuário"
                  />

                  {/* SENHA */}
                  <Text className="text-[15px] font-semibold text-[#52627B] mb-[9px] mt-[1px]">
                    Senha
                  </Text>

                  <View className="min-h-[47px] flex-row items-center border border-[#DDE6F5] rounded-[14px] px-3 mb-5">
                    <TextInput
                      className="flex-1 min-w-0 h-[45px] text-sm text-[#263449]"
                      placeholder="Digite sua senha"
                      placeholderTextColor="#A7A7A7"
                      value={senha}
                      onChangeText={setSenha}
                      secureTextEntry={!senhaVisivel}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      accessibilityLabel="Senha"
                    />

                    <TouchableOpacity
                      onPress={() => setSenhaVisivel(!senhaVisivel)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        senhaVisivel ? "Ocultar senha" : "Mostrar senha"
                      }
                      activeOpacity={0.7}
                    >
                      <Text className="text-[11px] font-semibold text-[#657DA4] pl-2">
                        {senhaVisivel ? "Ocultar" : "Mostrar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                /* FORMULÁRIO DE RECUPERAÇÃO */
                <>
                  <Text className="text-xl font-extrabold text-[#2D4F83] mt-1 mb-2.5">
                    Recuperar acesso
                  </Text>

                  <Text className="text-sm leading-[21px] text-[#64748B] mb-5">
                    Informe seu e-mail cadastrado para receber instruções de recuperação da senha.
                  </Text>

                  <Text className="text-[15px] font-semibold text-[#52627B] mb-[9px] mt-[1px]">
                    E-mail
                  </Text>

                  <TextInput
                    className="h-[47px] border border-[#DDE6F5] rounded-[14px] px-[13px] text-sm text-[#263449] bg-white mb-5"
                    placeholder="Digite seu e-mail"
                    placeholderTextColor="#A7A7A7"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    accessibilityLabel="E-mail para recuperação"
                  />
                </>
              )}

              {/* ERRO */}
              {erroLogin ? (
                <Text
                  accessibilityRole="alert"
                  className="text-[#B91C1C] text-[13px] mb-3"
                >
                  {erroLogin}
                </Text>
              ) : null}

              {/* BOTÃO PRINCIPAL */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={carregando}
                accessibilityRole="button"
                className={`rounded-lg overflow-hidden ${
                  carregando ? "opacity-70" : ""
                }`}
              >
                <LinearGradient
                  colors={["#A340C4", "#C15BDD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    minHeight: 46,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                  }}
                >
                  <Text className="text-sm font-bold text-white">
                    {carregando
                      ? activeTab === "login"
                        ? "Entrando..."
                        : "Enviando..."
                      : activeTab === "login"
                        ? "Entrar"
                        : "Enviar instruções"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* VOLTAR PARA LOGIN */}
              {activeTab === "recuperar" && (
                <TouchableOpacity
                  className="items-center pt-[18px]"
                  onPress={() => {
                    setActiveTab("login");
                    setErroLogin("");
                    Keyboard.dismiss();
                  }}
                  activeOpacity={0.7}
                >
                  <Text className="text-[13px] font-semibold text-[#6F53B6]">
                    Voltar para o login
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTÃO DE ACESSIBILIDADE */}
      {!tecladoAberto && (
        <TouchableOpacity
          className="absolute right-[18px] bottom-[18px] w-[54px] h-[54px] rounded-full bg-[#8754BF] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Acessibilidade"
          onPress={() =>
            Alert.alert(
              "Acessibilidade",
              "As opções de acessibilidade serão implementadas nesta versão."
            )
          }
        >
          <Text className="text-white text-[25px]">♿</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
