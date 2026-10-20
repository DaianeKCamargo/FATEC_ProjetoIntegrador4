const LOCAL_BACKEND_BASE_URL = 'http://10.0.2.2:5500/api';

const PRODUCTION_BACKEND_BASE_URL =
  'https://projeto-integrador-3-back.vercel.app/api';

export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? PRODUCTION_BACKEND_BASE_URL
      : LOCAL_BACKEND_BASE_URL)
  ).replace(/\/$/, '');
