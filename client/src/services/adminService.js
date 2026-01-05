import api from '../utils/api';
import notify from '../utils/notifications';

const adminService = {

  getAllUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data;
    } catch (err) {
      notify.error(err.message || 'Failed to fetch users');
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
      if (res.data?.message) notify.success(res.data.message);
      return res.data;
    } catch (err) {
      notify.error(err.message || 'Failed to update user');
      return { success: false, message: err.message };
    }
  },

  deleteUser: async (userId) => {
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data?.message) notify.success(res.data.message);
      return res.data;
    } catch (err) {
      notify.error(err.message || 'Failed to delete user');
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
