import axios from "axios";

const baseURL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/";

const api = axios.create({ baseURL });

export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
};

const saved = localStorage.getItem("token");
if (saved) setToken(saved);

export default api;
