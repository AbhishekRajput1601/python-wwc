import api from '../utils/api.js';
import notify from '../utils/notifications.js';

class MeetingService {
  async createMeeting(meetingData) {
    try {
      const response = await api.post('/meetings', meetingData);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async getMeetings() {
    try {
      const response = await api.get('/meetings');
      
      return {
        success: true,
        data: response.data,
        meetings: response.data.meetings
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch meetings',
        error: error.response?.data || error.message
      };
    }
  }

  async getMeeting(meetingId) {
    try {
      const response = await api.get(`/meetings/${meetingId}`);
      
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch meeting',
        error: error.response?.data || error.message
      };
    }
  }

  async joinMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/join`);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async leaveMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/leave`);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to leave meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async updateMeeting(meetingId, updateData) {
    try {
      const response = await api.put(`/meetings/${meetingId}`, updateData);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async deleteMeeting(meetingId) {
    try {
      const response = await api.delete(`/meetings/${meetingId}`);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async endMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/end`);
      if (response.data?.message) notify.success(response.data.message);
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to end meeting';
      notify.error(message);
      return {
        success: false,
        message,
        error: error.response?.data || error.message
      };
    }
  }

  async uploadRecording(meetingId, fileBlob) {
    try {
      const formData = new FormData();
      formData.append('file', fileBlob, `recording-${meetingId}.webm`);
      const response = await api.post(`/meetings/${meetingId}/recordings`, formData);

      if (response.data?.message) notify.success(response.data.message || 'Recording uploaded');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload recording';
      notify.error(message);
      return { success: false, message, error: error.response?.data || error.message };
    }
  }
}

export default new MeetingService();