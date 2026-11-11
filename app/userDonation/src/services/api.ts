const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

const API_URL: string = apiUrl;

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  console.log('URL da requisição:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
}