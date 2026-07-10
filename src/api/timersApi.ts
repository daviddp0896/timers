import axios from 'axios';

// The single axios instance for the whole app (Rule 1).
// Only action files may import this — it is the HTTP boundary.
const timersApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the auth token (if present) to every request.
timersApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { timersApi };
