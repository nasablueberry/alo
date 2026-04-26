// Central API configuration
// In development, Vite proxy handles /api -> localhost:5000
// In production, VITE_API_URL points to the deployed backend
export const API = import.meta.env.VITE_API_URL || '/api';
