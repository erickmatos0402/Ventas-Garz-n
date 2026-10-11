import axios, { AxiosInstance } from 'axios';
import { AuthResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setToken(this.token);
    }

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Solo limpiar sesión en 401 de endpoints autenticados (no en el propio login)
        const url: string = error.config?.url || '';
        const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
        if (error.response?.status === 401 && !isAuthAttempt) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new APIClient();

// PostgreSQL devuelve DECIMAL como string; normalizar a number para el cliente
function normalizeProduct<T extends { price?: any; rating?: any; reviews?: any }>(p: T): T {
  return {
    ...p,
    price: p.price != null ? Number(p.price) : p.price,
    rating: p.rating != null ? Number(p.rating) : p.rating,
    reviews: p.reviews != null ? Number(p.reviews) : p.reviews,
  } as T;
}

function normalizeProductsPayload<T>(payload: any): T {
  if (Array.isArray(payload)) return payload.map(normalizeProduct) as unknown as T;
  if (payload && Array.isArray(payload.data)) {
    return { ...payload, data: payload.data.map(normalizeProduct) } as T;
  }
  return payload as T;
}

function normalizeOrderPayload<T>(payload: any): T {
  const fixOrder = (o: any) => ({ ...o, total: o.total != null ? Number(o.total) : o.total });
  if (Array.isArray(payload)) return payload.map(fixOrder) as unknown as T;
  if (payload && Array.isArray(payload.data)) {
    return { ...payload, data: payload.data.map(fixOrder) } as T;
  }
  if (payload && payload.total != null) return fixOrder(payload) as unknown as T;
  return payload as T;
}

// Auth Services
export const authService = {
  register: async (email: string, password: string, name: string) => {
    const response = await apiClient.getClient().post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    });
    apiClient.setToken(response.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.getClient().post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    apiClient.setToken(response.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: () => {
    apiClient.clearToken();
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: async () => {
    const response = await apiClient.getClient().get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.getClient().put<User>('/auth/profile', data);
    localStorage.setItem('auth_user', JSON.stringify(response.data));
    return response.data;
  },

  forgotPassword: async (email: string) => {
    return await apiClient.getClient().post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string) => {
    return await apiClient.getClient().post('/auth/reset-password', { token, password });
  },
};

// Product Services
export const productService = {
  getAllProducts: async (page = 1, category?: string) => {
    const params = new URLSearchParams({ page: page.toString() });
    if (category) params.append('category', category);
    const response = await apiClient.getClient().get(`/products?${params}`);
    return normalizeProductsPayload(response.data);
  },

  getProduct: async (id: string) => {
    const response = await apiClient.getClient().get(`/products/${id}`);
    return normalizeProduct(response.data);
  },

  searchProducts: async (query: string) => {
    const response = await apiClient.getClient().get('/products/search', {
      params: { q: query },
    });
    return normalizeProductsPayload(response.data);
  },
};

// Order Services
export const orderService = {
  createOrder: async (items: any[], shippingAddress: string) => {
    const response = await apiClient.getClient().post('/orders', {
      items,
      shippingAddress,
    });
    return normalizeOrderPayload(response.data);
  },

  getOrders: async (page = 1) => {
    const response = await apiClient.getClient().get('/orders', {
      params: { page },
    });
    return normalizeOrderPayload(response.data);
  },

  getOrder: async (id: string) => {
    const response = await apiClient.getClient().get(`/orders/${id}`);
    return normalizeOrderPayload(response.data);
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.getClient().patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// Admin Services
export const adminService = {
  getDashboard: async () => {
    const response = await apiClient.getClient().get('/admin/dashboard');
    return response.data;
  },

  getProducts: async (page = 1) => {
    const response = await apiClient.getClient().get('/admin/products', {
      params: { page },
    });
    return normalizeProductsPayload(response.data);
  },

  createProduct: async (data: any) => {
    const response = await apiClient.getClient().post('/admin/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: any) => {
    const response = await apiClient.getClient().put(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.getClient().delete(`/admin/products/${id}`);
    return response.data;
  },

  getOrders: async (page = 1, status?: string) => {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);
    const response = await apiClient.getClient().get(`/admin/orders?${params}`);
    return response.data;
  },

  getUsers: async (page = 1) => {
    const response = await apiClient.getClient().get('/admin/users', {
      params: { page },
    });
    return response.data;
  },

  getSalesAnalytics: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.getClient().get('/admin/analytics/sales', { params });
    return response.data;
  },
};
