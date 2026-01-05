import axios from "axios";
import notify from '../utils/notifications.js';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const captionsService = {
  async getCaptions(meetingId, language = "en", limit = 50, page = 1) {
    const token = sessionStorage.getItem("token");
    const res = await axios.get(`${API_URL}/captions/${meetingId}`, {
      params: { language, limit, page },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  async exportCaptions(meetingId, language = "en", format = "txt") {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/captions/${meetingId}/export`, {
        params: { language, format },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      notify.success('Export ready');
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to export captions';
      notify.error(message);
      return { success: false, message, error: error.response?.data || error.message };
    }
  },

  async transcribeAudio(meetingId, audioBlob, language = "en", translate = false) {
    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    try {
      const res = await axios.post(`${API_URL}/captions/${meetingId}/transcribe`, formData, {
        params: { language, translate: translate ? "true" : "false" },
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.data?.message) notify.success(res.data.message || 'Transcription completed');
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to transcribe audio';
      notify.error(message);
      return { success: false, message, error: error.response?.data || error.message };
    }
  },
};

export default captionsService;
