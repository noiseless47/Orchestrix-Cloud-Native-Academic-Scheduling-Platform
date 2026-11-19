import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
