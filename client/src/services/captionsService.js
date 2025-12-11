import axios from "axios";

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
    const res = await axios.get(`${API_URL}/captions/${meetingId}/export`, {
      params: { language, format },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: "blob",
    });
    return res.data;
  },

  async transcribeAudio(meetingId, audioBlob, language = "en", translate = false) {
    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    const res = await axios.post(`${API_URL}/captions/${meetingId}/transcribe`, formData, {
      params: { language, translate: translate ? "true" : "false" },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  },
};

export default captionsService;
