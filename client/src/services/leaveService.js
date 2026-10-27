import api from './api';

export const leaveService = {
  applyLeave: async (data) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  getMyLeaves: async () => {
    const response = await api.get('/leaves/my-leaves');
    return response.data;
  },

  getAllLeaves: async (params = {}) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  getLeaveById: async (id) => {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  updateLeaveStatus: async (id, data) => {
    const response = await api.patch(`/leaves/${id}/status`, data);
    return response.data;
  }
};
