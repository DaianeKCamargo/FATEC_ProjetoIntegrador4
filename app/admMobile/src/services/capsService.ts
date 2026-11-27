export type RegistroCapsAPI = {
  id: number | string;
  data: string;
  quantidade_kg: number | string;
  quantidade_tampinhas?: number | null;
  origem: 'MANUAL' | 'BALANCA';
  responsavel: string;
  ponto_id: string | null;
  nome_ponto: string | null;
};

const API_URL = process.env.EXPO_PUBLIC_CAPS_API_URL
  ?.replace(/\/+$/, '')
  .replace(/\/api$/, '');

function obterEnderecoAPI() {
  if (!API_URL) {
    throw new Error('Endereço da API de tampinhas não configurado.');
  }

  return `${API_URL}/api/caps`;
}

async function requisicao<T>(
  endpoint: string,
  metodo: string,
  corpo?: object
): Promise<T> {
  const resposta = await fetch(`${obterEnderecoAPI()}${endpoint}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const texto = await resposta.text();

  let dados: any;

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(`Resposta inválida da API (HTTP ${resposta.status}).`);
  }

  if (!resposta.ok) {
    throw new Error(
      dados.message || 'Erro ao realizar operação com os registros.'
    );
  }

  return dados as T;
}

// Lista todos os registros
async function listarRegistros(): Promise<RegistroCapsAPI[]> {
  return requisicao<RegistroCapsAPI[]>('', 'GET');
}

// Cadastra um registro manual
async function cadastrarRegistro(data: string, quantidade_kg: number) {
  return requisicao('', 'POST', {
    data,
    quantidade_kg,
  });
}

// Edita um registro manual
async function editarRegistro(
  id: number | string,
  data: string,
  quantidade_kg: number
) {
  return requisicao(`/${id}`, 'PUT', {
    data,
    quantidade_kg,
  });
}

// Exclui um registro pela origem e pelo ID
async function excluirRegistro(
  id: number | string,
  origem: 'MANUAL' | 'BALANCA'
) {
  return requisicao(`/${origem}/${id}`, 'DELETE');
}

const capsService = {
  listarRegistros,
  cadastrarRegistro,
  editarRegistro,
  excluirRegistro,
};

export default capsService;