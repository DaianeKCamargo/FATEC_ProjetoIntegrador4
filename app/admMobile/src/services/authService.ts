
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "").replace(
  /\/api$/,
  ""
);

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

type ApiResponse = {
  message: string;
};

// LOGIN

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

  const corpo = await resposta.text();
  let dados: Partial<LoginResponse> & { message?: string };

  try {
    dados = JSON.parse(corpo);
  } catch {
    throw new Error(
      `A API de autenticação respondeu com conteúdo inválido (HTTP ${resposta.status}).`
    );
  }

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

// RECUPERAÇÃO DE SENHA

async function requisicaoRecuperacao(
  endpoint: string,
  dadosEnvio: Record<string, string>
): Promise<ApiResponse> {
  if (!API_URL) {
    throw new Error("Endereço da API não configurado.");
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosEnvio),
  });

  const corpo = await resposta.text();

  let dados: ApiResponse;

  try {
    dados = JSON.parse(corpo);
  } catch {
    throw new Error(
      `A API respondeu com conteúdo inválido (HTTP ${resposta.status}).`
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dados.message || "Não foi possível realizar a operação."
    );
  }

  return dados;
}

// 1. Solicitar envio do token por e-mail

export async function solicitarRecuperacao(
  emailUser: string
): Promise<ApiResponse> {
  return requisicaoRecuperacao(
    "/api/password-reset/solicitar",
    {
      emailUser: emailUser.trim().toLowerCase(),
    }
  );
}

// 2. Validar token recebido por e-mail

export async function validarTokenRecuperacao(
  emailUser: string,
  resetToken: string
): Promise<ApiResponse> {
  return requisicaoRecuperacao(
    "/api/password-reset/validar",
    {
      emailUser: emailUser.trim().toLowerCase(),
      resetToken: resetToken.trim(),
    }
  );
}

// 3. Redefinir senha

export async function redefinirSenha(
  emailUser: string,
  resetToken: string,
  novaSenha: string
): Promise<ApiResponse> {
  return requisicaoRecuperacao(
    "/api/password-reset/redefinir",
    {
      emailUser: emailUser.trim().toLowerCase(),
      resetToken: resetToken.trim(),
      novaSenha,
    }
  );
}

// TOKEN / SESSÃO

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

export async function verificarSessao() {
  const token = await obterToken();

  if (!token || !API_URL) {
    return false;
  }

  const resposta = await fetch(`${API_URL}/api/admin/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (resposta.status === 401 || resposta.status === 403) {
    await removerToken();
    return false;
  }

  if (!resposta.ok) {
    throw new Error("Não foi possível verificar sua sessão.");
  }

  return true;
}

export async function removerToken() {
  if (Platform.OS === "web") {
    tokenWeb = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
