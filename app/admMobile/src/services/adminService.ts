
import { obterToken } from "./authService";

const API_URL = process.env.EXPO_PUBLIC_API_URL
  ?.replace(/\/+$/, "")
  .replace(/\/api$/, "");

export interface Administrador {
  idAdmin: number;
  username: string;
  emailUser: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listarAdministradores(): Promise<Administrador[]> {
  const token = await obterToken();

  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const resposta = await fetch(`${API_URL}/api/admins`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message || "Erro ao buscar administradores.");
  }

  return dados;
}
export async function cadastrarAdministrador(
  administrador: {
    username: string;
    emailUser: string;
    senha: string;
  }
) {
  const token = await obterToken();

  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const resposta = await fetch(`${API_URL}/api/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(administrador),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message || "Erro ao cadastrar administrador.");
  }

  return dados;
}
export async function editarAdministrador(
  idAdmin: number,
  administrador: {
    username: string;
    emailUser: string;
    senha?: string;
  }
) {
  const token = await obterToken();

  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const resposta = await fetch(`${API_URL}/api/admins/${idAdmin}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(administrador),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.message || "Erro ao editar administrador.");
  }

  return dados;
}