import axios from 'axios';

// Get API base URL from environment, or use fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10s timeout
});

export const apiService = {
  /**
   * Fetch chat history (latest 100 messages)
   * @returns {Promise<Array>}
   */
  getMessages: async () => {
    try {
      const response = await apiClient.get('/messages');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch chat history');
    }
  },

  /**
   * Health check
   * @returns {Promise<object>}
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Chat server is unreachable');
    }
  },

  /**
   * POST message fallback (primarily for assignment API completeness)
   * @param {string} username 
   * @param {string} message 
   * @returns {Promise<object>}
   */
  createMessageRest: async (username, message) => {
    try {
      const response = await apiClient.post('/messages', { username, message });
      return response.data;
    } catch (error) {
      console.error('REST message send failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message via REST');
    }
  }
};
