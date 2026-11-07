
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/animals-registration`;

export interface Animal {
  id: number;
  data: string;
  tipoAnimal: 'gato' | 'cachorro';
  quantidade: number;
}

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'Erro na comunicação com o servidor');
  }

  return result;
}

const animalsService = {
  async getAll(): Promise<Animal[]> {
    return request(API_URL);
  },

  async getById(id: string): Promise<Animal> {
    return request(`${API_URL}/${id}`);
  },

  async create(dados: Omit<Animal, 'id'>): Promise<Animal> {
    return request(API_URL, {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  async update(id: string, dados: Partial<Omit<Animal, 'id'>>): Promise<Animal> {
    return request(`${API_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  async remove(id: string): Promise<void> {
    await request(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

export default animalsService;
