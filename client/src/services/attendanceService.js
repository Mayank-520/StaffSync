import api from './api';

export const attendanceService = {
  checkIn: async (data = {}) => {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },

  checkOut: async (data = {}) => {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },

  getTodayStatus: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  getMyHistory: async (params = {}) => {
    const response = await api.get('/attendance/my-history', { params });
    return response.data;
  },

  getTeamAttendance: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  }
};
