import api from './api';

export const trainingService = {
  getTrainings: async (params = {}) => {
    const response = await api.get('/trainings', { params });
    return response.data;
  },

  getMyTrainings: async () => {
    const response = await api.get('/trainings/my-trainings');
    return response.data;
  },

  createTraining: async (data) => {
    const response = await api.post('/trainings', data);
    return response.data;
  },

  assignEmployees: async (id, employeeIds) => {
    const response = await api.post(`/trainings/${id}/assign`, { employeeIds });
    return response.data;
  },

  updateProgress: async (id, status) => {
    const response = await api.patch(`/trainings/${id}/progress`, { status });
    return response.data;
  },

  deleteTraining: async (id) => {
    const response = await api.delete(`/trainings/${id}`);
    return response.data;
  }
};
