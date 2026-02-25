import axios from 'axios';

// Si estás en desarrollo (localhost), usa el local. Si no, usa la URL de Render
const API = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://tu-backend.render.com/api'  // <-- ESTO LO CAMBIAREMOS DESPUÉS
        : 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;