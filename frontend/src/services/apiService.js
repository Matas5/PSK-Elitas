import axios from 'axios';

const API_BASE_URL = '/api/risk-indicators';

const apiService = {
  getAllRiskIndicators: async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching risk indicators:', error);
      throw error;
    }
  },

  getRiskIndicatorById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching risk indicator:', error);
      throw error;
    }
  },

  createRiskIndicator: async (indicator) => {
    try {
      const response = await axios.post(API_BASE_URL, indicator);
      return response.data;
    } catch (error) {
      console.error('Error creating risk indicator:', error);
      throw error;
    }
  },

  updateRiskIndicator: async (id, indicator) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, indicator);
      return response.data;
    } catch (error) {
      console.error('Error updating risk indicator:', error);
      throw error;
    }
  },

  deleteRiskIndicator: async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.error('Error deleting risk indicator:', error);
      throw error;
    }
  }
};

export default apiService;
