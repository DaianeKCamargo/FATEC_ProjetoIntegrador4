
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const menuItems = [
  {
    id: "collection-point",
    title: "Ponto de Coleta",
    description: "Gerenciar pontos de coleta de resíduos",
    icon: "place" as const,
    route: "/(admin)/ponto-coleta",
  },
  {
    id: "caps-animals",
    title: "Registro de Tampinhas e Animais Castrados",
    description: "Registrar tampinhas e animais que foram castrados",
    icon: "pets" as const,
    route: "/(admin)/registro-tampinhas-animais",
  },
  {
    id: "news",
    title: "Registro de Notícias",
    description: "Criar e gerenciar notícias do sistema",
    icon: "article" as const,
    route: "/(admin)/noticias",
  },
  {
    id: "credentials",
    title: "Credenciais",
    description: "Gerenciar credenciais e acesso",
    icon: "security" as const,
    route: "/(admin)/credenciais",
  },
];

export default function Dashboard() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.logo}>TamPets</Text>

      <Text style={styles.title}>Painel de Administração</Text>

      <Text style={styles.subtitle}>
        Selecione uma opção para gerenciar o sistema.
      </Text>

      <View style={styles.cards}>
        {menuItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={item.icon}
                size={32}
                color="#47734D"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>

              <Text style={styles.cardDescription}>
                {item.description}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={styles.buttonText}>Acessar</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F8F4",
  },

  container: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#47734D",
    marginBottom: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#263328",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#687168",
    marginBottom: 24,
  },

  cards: {
    gap: 16,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EAF2E8",
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    flex: 1,
    gap: 8,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#263328",
  },

  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#687168",
  },

  button: {
    marginTop: 6,
    backgroundColor: "#47734D",
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 8,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
