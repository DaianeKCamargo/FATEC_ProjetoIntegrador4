
export type CollectionPoint = {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
};

export const collectionPoints: CollectionPoint[] = [
  {
    id: 'PONTO-001',
    name: 'Ponto de Coleta Central',
    address: 'Praça Central — endereço de exemplo',
    status: 'active',
  },
  {
    id: 'PONTO-002',
    name: 'Ponto de Coleta do Parque',
    address: 'Parque Municipal — endereço de exemplo',
    status: 'active',
  },
];
