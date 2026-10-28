import axios from 'axios';
import { API_BASE_URL } from './apiBase';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const AUTH_API_BASE =
  process.env.EXPO_PUBLIC_AUTH_API_URL ||
  'https://projeto-integrador-3-back.vercel.app/api';

export const authApi = axios.create({
  baseURL: AUTH_API_BASE,
  withCredentials: true,
});

export default api;;