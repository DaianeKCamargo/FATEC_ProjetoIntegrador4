const LOCAL_BACKEND_BASE_URL = 'http://localhost:5500/api';

const PRODUCTION_BACKEND_BASE_URL =
  'https://projeto-integrador-3-back.vercel.app/api';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  PRODUCTION_BACKEND_BASE_URL
).replace(/\/$/, '');

console.log('URL DA API:', API_BASE_URL);