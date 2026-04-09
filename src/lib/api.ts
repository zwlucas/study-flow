import axios from "axios";

// Pega a URL do servidor (fallback pra 3333 se rodando local no dev server do Next/Tauri)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://git.devlucas.me:3333/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para injetar o JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("@studyflow:token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor genérico para deslogar usuário caso o token expire
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("@studyflow:token");
        localStorage.removeItem("@studyflow:user");
        // Opcional: redirecionar pro login dependendo do router do Next.js
        // window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);
