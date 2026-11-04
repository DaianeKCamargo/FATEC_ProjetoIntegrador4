
import { apiFetch } from './api';
import type { CollectionPoint } from '@/constants/collection-points';

export async function getCollectionPoints(): Promise<CollectionPoint[]> {
  return apiFetch<CollectionPoint[]>('/pontos');
}

export async function getCollectionPoint(
  id: number
): Promise<CollectionPoint> {
  return apiFetch<CollectionPoint>(`/pontos/${id}`);
}
