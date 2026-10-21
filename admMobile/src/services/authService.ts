
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "tampets_admin_token";

let tokenWeb: string | null = null;

type LoginResponse = {
  message: string;
  token: string;
  admin: {
    idAdmin: number;
    username: string;
    emailUser: string;
  };
};

export async function realizarLogin(
  username: string,
  senha: string
): Promise<LoginResponse> {
  if (!API_URL) {
    throw new Error("Endereço da API não configurado.");
  }

  const resposta = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      senha,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.message || "Não foi possível realizar o login."
    );
  }

  if (!dados.token) {
    throw new Error("A API não retornou um token.");
  }

  return dados as LoginResponse;
}

export async function salvarToken(token: string) {
  if (Platform.OS === "web") {
    tokenWeb = token;
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function obterToken() {
  if (Platform.OS === "web") {
    return tokenWeb;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removerToken() {
  if (Platform.OS === "web") {
    tokenWeb = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
