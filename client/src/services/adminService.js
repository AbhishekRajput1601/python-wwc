import api from '../utils/api';

const adminService = {

  getAllUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getUserById: async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  updateUser: async (userId, payload) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, payload);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  deleteUser: async (userId) => {
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getDashboardStats: async () => {
    try {
      const res = await api.get('/admin/dashboard');
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

};

export default adminService;
