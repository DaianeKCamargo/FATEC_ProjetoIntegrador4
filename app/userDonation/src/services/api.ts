const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  console.log('URL da requisição:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
}