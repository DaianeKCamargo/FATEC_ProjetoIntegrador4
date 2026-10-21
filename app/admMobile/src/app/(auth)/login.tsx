
import { useRouter } from "expo-router";
import { realizarLogin, salvarToken } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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

  const [activeTab, setActiveTab] = useState<"login" | "recuperar">(
    "login"
  );

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  async function handleSubmit() {
    if (activeTab === "recuperar") {
      if (!email.trim()) {
        setErroLogin("Informe seu e-mail.");
        return;
      }

      Alert.alert(
        "Recuperar senha",
        "A recuperação de senha ainda será integrada à API."
      );
      return;
    }

    if (!usuario.trim() || !senha) {
      setErroLogin("Preencha seu usuário e sua senha.");
      return;
    }

    if (carregando) return;

    setCarregando(true);
    setErroLogin("");

    try {
      const resultado = await realizarLogin(usuario.trim(), senha);

      await salvarToken(resultado.token);

      setSenha("");

      router.replace("/(admin)/dash-registration");
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
    <View style={styles.screen}>
      {/* Decoração do fundo */}
      <View pointerEvents="none" style={styles.decorationTop}>
        <View style={styles.bubble} />
        <View style={styles.bubbleSmall} />
        <View style={styles.bubble} />
      </View>

      <View pointerEvents="none" style={styles.decorationBottom}>
        <View style={styles.bubbleSmall} />
        <View style={styles.bubble} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWideScreen && styles.scrollContentWide,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.content,
              isWideScreen && styles.contentWide,
            ]}
          >
            {/* Painel de boas-vindas */}
            <View
              style={[
                styles.welcomeCard,
                isWideScreen && styles.welcomeCardWide,
              ]}
            >
              <LinearGradient
                colors={["#587DBB", "#C15BDD"]}
                style={styles.welcomeStripe}
              />

              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeLabel}>
                  Seja Bem-Vindo!
                </Text>

                <Text style={styles.welcomeTitle}>
                  O progresso de hoje constrói a conquista de amanhã.
                </Text>

                <Text style={styles.welcomeDescription}>
                  TamPets — juntos por um futuro melhor para os animais.
                </Text>
              </View>
            </View>

            {/* Painel de autenticação */}
            <View
              style={[
                styles.formCard,
                isWideScreen && styles.formCardWide,
              ]}
            >
              {/* Abas */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "login" && styles.activeTab,
                  ]}
                  onPress={() => {
                    setActiveTab("login");
                    setErroLogin("");
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === "login",
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "login" &&
                        styles.activeTabText,
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "recuperar" &&
                      styles.activeTab,
                  ]}
                  onPress={() => {
                    setActiveTab("recuperar");
                    setErroLogin("");
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === "recuperar",
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "recuperar" &&
                        styles.activeTabText,
                    ]}
                  >
                    Recuperar Senha
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === "login" ? (
                <>
                  <Text style={styles.label}>Usuário</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu usuário"
                    placeholderTextColor="#A7A7A7"
                    value={usuario}
                    onChangeText={setUsuario}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    accessibilityLabel="Usuário"
                  />

                  <Text style={styles.label}>Senha</Text>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
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
                      onPress={() =>
                        setSenhaVisivel(!senhaVisivel)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        senhaVisivel
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      <Text style={styles.showPassword}>
                        {senhaVisivel ? "Ocultar" : "Mostrar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.recoveryTitle}>
                    Recuperar acesso
                  </Text>

                  <Text style={styles.recoveryDescription}>
                    Informe seu e-mail cadastrado para receber
                    instruções de recuperação da senha.
                  </Text>

                  <Text style={styles.label}>E-mail</Text>

                  <TextInput
                    style={styles.input}
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

              {/* Mensagem de erro */}
              {erroLogin ? (
                <Text
                  accessibilityRole="alert"
                  style={styles.errorText}
                >
                  {erroLogin}
                </Text>
              ) : null}

              {/* Botão de envio */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={carregando}
                accessibilityRole="button"
                style={styles.submitButton}
              >
                <LinearGradient
                  colors={["#A340C4", "#C15BDD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {carregando
                      ? "Entrando..."
                      : activeTab === "login"
                        ? "Entrar"
                        : "Enviar instruções"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {activeTab === "recuperar" && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setActiveTab("login");
                    setErroLogin("");
                  }}
                >
                  <Text style={styles.backButtonText}>
                    Voltar para o login
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Atalho visual de acessibilidade */}
      <TouchableOpacity
        style={styles.accessibilityButton}
        accessibilityRole="button"
        accessibilityLabel="Acessibilidade"
        onPress={() =>
          Alert.alert(
            "Acessibilidade",
            "As opções de acessibilidade serão implementadas nesta versão."
          )
        }
      >
        <Text style={styles.accessibilityIcon}>♿</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFE",
    overflow: "hidden",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  scrollContentWide: {
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 28,
  },
  contentWide: {
    maxWidth: 1280,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 84,
  },

  // Painel esquerdo
  welcomeCard: {
    minHeight: 270,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E0E8F7",
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#435B85",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 4,
  },
  welcomeCardWide: {
    flex: 1,
    maxWidth: 680,
    minHeight: 390,
  },
  welcomeStripe: {
    width: 9,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  welcomeLabel: {
    fontSize: 19,
    fontWeight: "600",
    color: "#263449",
    marginBottom: 22,
    textAlign: "center",
  },
  welcomeTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    color: "#2D4F83",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  welcomeDescription: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  // Painel direito
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: 25,
    paddingVertical: 28,
    shadowColor: "#52617A",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  formCardWide: {
    flex: 1,
    maxWidth: 520,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF1F7",
    padding: 5,
    borderRadius: 30,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 5,
  },
  activeTab: {
    backgroundColor: "#719EDB",
  },
  tabText: {
    color: "#52627B",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#52627B",
    marginBottom: 9,
    marginTop: 1,
  },
  input: {
    height: 47,
    borderWidth: 1,
    borderColor: "#DDE6F5",
    borderRadius: 14,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#263449",
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  passwordContainer: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE6F5",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: 45,
    fontSize: 14,
    color: "#263449",
  },
  showPassword: {
    fontSize: 11,
    fontWeight: "600",
    color: "#657DA4",
    paddingLeft: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 0,
  },
  submitGradient: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recoveryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D4F83",
    marginTop: 4,
    marginBottom: 10,
  },
  recoveryDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  backButton: {
    alignItems: "center",
    paddingTop: 18,
  },
  backButtonText: {
    color: "#6F53B6",
    fontSize: 13,
    fontWeight: "600",
  },

  // Decoração
  decorationTop: {
    position: "absolute",
    top: 25,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    opacity: 0.3,
  },
  decorationBottom: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    opacity: 0.25,
  },
  bubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DCE3FA",
    backgroundColor: "#E9E9FC",
  },
  bubbleSmall: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#E1D9FA",
  },
  accessibilityButton: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#8754BF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  accessibilityIcon: {
    color: "#FFFFFF",
    fontSize: 25,
  },
});
