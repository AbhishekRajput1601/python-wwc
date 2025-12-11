import api from '../utils/api.js';

class AuthService {
  async updateUserDetails(details) {
    try {
      const response = await api.post('/auth/update-details', details);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user details',
        error: error.response?.data || error.message
      };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success && response.data.token) {
        sessionStorage.setItem('token', response.data.token);
        api.setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        error: error.response?.data || error.message
      };
    }
  }

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.token) {
        sessionStorage.setItem('token', response.data.token);
        api.setAuthToken(response.data.token);
      }
      
      return {
        success: true,
        data: response.data,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        error: error.response?.data || error.message
      };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
      sessionStorage.removeItem('token');
      api.setAuthToken(null);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      sessionStorage.removeItem('token');
      api.setAuthToken(null);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      
      return {
        success: true,
        data: response.data,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user profile',
        error: error.response?.data || error.message
      };
    }
  }

  async updatePreferences(preferences) {
    try {
      const response = await api.put('/auth/preferences', preferences);
      
      return {
        success: true,
        data: response.data,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update preferences',
        error: error.response?.data || error.message
      };
    }
  }

  isAuthenticated() {
    const token = sessionStorage.getItem('token');
    return !!token;
  }

  getToken() {
    return sessionStorage.getItem('token');
  }
}

export default new AuthService();