import api from './api';

export const announcementService = {
  getAnnouncements: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getAnnouncementById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  createAnnouncement: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  updateAnnouncement: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};
