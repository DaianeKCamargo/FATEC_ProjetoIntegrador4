
export type CollectionPoint = {
  id: number;
  name: string;
  status: 'APROVADO';
  opensDay: string;
  hourInit: string;
  hourFinal: string;
  photo: string;
  address: {
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    postCode: string;
    latitude: number | null;
    longitude: number | null;
  };
};
