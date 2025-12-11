import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user: ctxUser, dispatch, loadUser } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  const [recordingsModalOpen, setRecordingsModalOpen] = useState(false);
  const [currentMeetingForRecordings, setCurrentMeetingForRecordings] =
    useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const [captionsModalOpen, setCaptionsModalOpen] = useState(false);
  const [captionsModalContent, setCaptionsModalContent] = useState("");
  const [activityRange, setActivityRange] = useState(7);
  const [openParticipantsId, setOpenParticipantsId] = useState(null);

  const [dropdownPos, setDropdownPos] = useState(null);
  const [dropdownParticipants, setDropdownParticipants] = useState([]);

  const toggleParticipants = (e, id, participants) => {
    e.stopPropagation();
    if (openParticipantsId === id) {
      setOpenParticipantsId(null);
      setDropdownParticipants([]);
      setDropdownPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 288; // w-72
    let left = rect.right - dropdownWidth;
    if (left < 8) left = rect.left;

    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: left + window.scrollX,
    });
    setDropdownParticipants(participants || []);
    setOpenParticipantsId(id);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      let resUser = ctxUser;
      if (!ctxUser) {
        const res = await authService.getProfile();
        if (res.success) resUser = res.user;
        else setError(res.message);
      }

      if (resUser) {
        setUser(resUser);
        setForm({
          name: resUser?.name || "",
          email: resUser?.email || "",
          avatar: resUser?.avatar || "",
          role: resUser?.role ?? "user",
          preferences: {
            defaultLanguage: resUser?.preferences?.defaultLanguage || "en",
            captionsEnabled: resUser?.preferences?.captionsEnabled ?? true,
          },
        });
        setAvatarPreview(resUser?.avatar || "");
      }
      try {
        setMeetingsLoading(true);
        const res = await api.get("/meetings");
        const m = res.data?.meetings || res.data?.meetings || [];
        setMeetings(m);
      } catch (err) {
        console.error("Failed to fetch user meetings", err);
      } finally {
        setMeetingsLoading(false);
      }

      setLoading(false);
    };

    init();
  }, []);

  const stats = useMemo(() => {
    const totalMeetings = meetings.length;
    const userId = user?._id || user?.id || ctxUser?._id || ctxUser?.id;
    const hostedMeetings = meetings.filter(
      (m) =>
        m.host &&
        (m.host._id || m.host).toString() === (userId && userId.toString())
    ).length;
    const joinedMeetings = meetings.filter((m) =>
      (m.participants || []).some(
        (p) =>
          p.user &&
          (p.user._id || p.user).toString() === (userId && userId.toString())
      )
    ).length;

    const lastDays = [];
    const today = new Date();
    const range =
      typeof activityRange === "number" && activityRange > 0
        ? activityRange
        : 7;
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = meetings.filter((m) => {
        const meetingDate = new Date(m.createdAt);
        return meetingDate >= date && meetingDate < nextDay;
      }).length;

      lastDays.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      });
    }

    return {
      totalMeetings,
      hostedMeetings,
      joinedMeetings,
      activityDays: lastDays,
    };
  }, [meetings, activityRange, user, ctxUser]);

  const openRecordings = async (meeting) => {
    setCurrentMeetingForRecordings(meeting);
    setRecordingsModalOpen(true);
    setRecordingsLoading(true);
    setRecordingsError(null);
    setRecordingsList([]);
    setSelectedRecording(null);

    try {
      const res = await api.get(`/meetings/${meeting.meetingId}/recordings`);
      const recs = res.data?.recordings || [];
      setRecordingsList(recs);
      if (recs.length > 0) setSelectedRecording(recs[0]);
    } catch (err) {
      console.error("Failed to fetch recordings", err);
      setRecordingsError("Failed to load recordings");
    } finally {
      setRecordingsLoading(false);
    }
  };

  const closeRecordings = () => {
    setRecordingsModalOpen(false);
    setCurrentMeetingForRecordings(null);
    setRecordingsList([]);
    setSelectedRecording(null);
    setRecordingsError(null);
  };

  const openCaptions = async (meeting) => {
    try {
      const res = await api.get(`/meetings/${meeting.meetingId}/captions`, {
        responseType: "text",
      });
      const text =
        typeof res.data === "string" ? res.data : String(res.data || "");
      setCaptionsModalContent(text || "");
      setCaptionsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch captions", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err.message ||
        "Failed to load captions";
      setCaptionsModalContent(String(serverMsg));
      setCaptionsModalOpen(true);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("preferences.")) {
      const prefKey = name.split(".")[1];
      setForm({
        ...form,
        preferences: {
          ...form.preferences,
          [prefKey]: type === "checkbox" ? checked : value,
        },
      });
    } else if (name === "avatar") {
      setForm({ ...form, avatar: value });
      setAvatarPreview(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = {
      userId: user?.id,
      name: form.name,
      email: form.email,
      role: form.role,
    };

    const prevUser = user;
    setUser({ ...user, ...payload });
    try {
      const res = await authService.updateUserDetails(payload);
      if (res.success) {
        setSuccess("Profile updated successfully!");
        const updatedUser = res.user ? res.user : { ...prevUser, ...payload };
        setUser(updatedUser);
        if (dispatch) dispatch({ type: "USER_LOADED", payload: updatedUser });
      } else {
        setUser(prevUser);
        setError(res.message || "Update failed");
      }
    } catch (err) {
      setUser(prevUser);
      setError("Failed to update user details");
    }
    setLoading(false);
  };

  if (loading && !user) return <div>Loading...</div>;
  if (error && !user) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-4 sm:mt-6 md:mt-10 p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Your Profile</h2>
      </div>

      <div className="mt-4 sm:mt-6 md:mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-wwc-500 to-wwc-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold">{stats.totalMeetings}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Meetings</h3>
            <p className="text-[10px] sm:text-xs opacity-75 mt-1">
              Meetings you hosted or joined
            </p>
          </div>

          <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold">{stats.joinedMeetings}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Joined Meetings</h3>
            <p className="text-[10px] sm:text-xs opacity-75 mt-1">
              Meetings you joined as a participant
            </p>
          </div>

          <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-bold">{stats.hostedMeetings}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Hosted Meetings</h3>
            <p className="text-[10px] sm:text-xs opacity-75 mt-1">
              Meetings where you were the host
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-medium border border-neutral-100 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
              Your Meeting Activity
            </h2>
            <div className="flex items-center space-x-2">
              <label className="text-xs sm:text-sm text-neutral-600">Range:</label>
              <select
                value={activityRange}
                onChange={(e) => setActivityRange(Number(e.target.value))}
                className="border rounded px-2 py-1 text-xs sm:text-sm bg-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>1 month</option>
                <option value={90}>3 months</option>
              </select>
            </div>
          </div>
          <div className="h-32 sm:h-40 flex items-end justify-between px-1 sm:px-2 md:px-4 overflow-x-auto">
            {stats.activityDays.map((day, index) => {
              const maxCount = Math.max(
                ...stats.activityDays.map((d) => d.count),
                1
              );
              const heightPercent = (day.count / maxCount) * 100;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 mx-0.5 sm:mx-1 min-w-[32px] sm:min-w-[48px]"
                >
                  <div
                    className="w-full flex flex-col items-center justify-end"
                    style={{ height: "128px", maxHeight: "128px" }}
                  >
                    {day.count > 0 && (
                      <span className="text-[10px] sm:text-xs font-semibold text-wwc-700 mb-1">
                        {day.count}
                      </span>
                    )}
                    <div
                      className="w-full bg-gradient-to-t from-wwc-500 to-wwc-400 rounded-t-lg transition-all duration-500 hover:from-wwc-600 hover:to-wwc-500 cursor-pointer"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: day.count > 0 ? "16px" : "0px",
                      }}
                      title={`${day.count} meetings on ${day.date}`}
                    ></div>
                  </div>
                  <span className="text-[9px] sm:text-xs text-neutral-600 mt-1 sm:mt-2 font-medium text-center break-words">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-medium border border-neutral-100 p-3 sm:p-4 md:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-wwc-700 mb-3 sm:mb-4">
            Your Meetings
          </h2>
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="py-2 px-2 sm:px-3 md:px-4 font-semibold text-xs sm:text-sm">Title</th>
                  <th className="py-2 px-2 sm:px-3 md:px-4 font-semibold text-xs sm:text-sm">Video</th>
                  <th className="py-2 px-2 sm:px-3 md:px-4 font-semibold text-xs sm:text-sm">Caption</th>
                  <th className="py-2 px-2 sm:px-3 md:px-4 font-semibold text-xs sm:text-sm">Participants</th>
                  <th className="py-2 px-2 sm:px-3 md:px-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Created At</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m._id} className="border-b">
                    <td className="py-2 px-2 sm:px-3 md:px-4 text-xs sm:text-sm">{m.title}</td>
                    <td className="py-2 px-2 sm:px-3 md:px-4">
                      {(m.recordings && m.recordings.length > 0) ||
                      (m.recording && m.recording.public_id) ? (
                        <button
                          onClick={() => openRecordings(m)}
                          className="bg-wwc-600 hover:bg-wwc-700 text-white font-medium py-1 px-2 sm:px-3 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap"
                        >
                          Play
                        </button>
                      ) : m.recording && m.recording.status === "processing" ? (
                        <span className="text-xs sm:text-sm text-neutral-500">
                          Processing
                        </span>
                      ) : (
                        <button
                          onClick={() => openRecordings(m)}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-medium py-1 px-2 sm:px-3 rounded-md text-xs sm:text-sm border whitespace-nowrap"
                        >
                          Play
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-2 sm:px-3 md:px-4">
                      {m.captionsText ? (
                        <button
                          onClick={() => openCaptions(m)}
                          className="bg-wwc-600 hover:bg-wwc-700 text-white font-medium py-1 px-2 sm:px-3 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs sm:text-sm text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 sm:px-3 md:px-4 relative">
                      <div className="inline-block">
                        <button
                          onClick={(e) =>
                            toggleParticipants(e, m._id, m.participants)
                          }
                          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-xs sm:text-sm border whitespace-nowrap"
                        >
                          <span>{(m.participants || []).length}</span>
                          <span className="text-neutral-600 hidden sm:inline">Participants</span>
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      {openParticipantsId === m._id &&
                        dropdownPos &&
                        createPortal(
                          <div
                            style={{
                              position: "absolute",
                              top: dropdownPos.top + "px",
                              left: dropdownPos.left + "px",
                              width: "288px",
                              maxWidth: "90vw",
                            }}
                            className="bg-white border rounded-lg shadow-lg z-50"
                          >
                            <div className="p-2">
                              <div className="text-sm font-medium text-neutral-800 mb-2">
                                Participants (
                                {(dropdownParticipants || []).length})
                              </div>
                              <ul className="space-y-2 max-h-48 overflow-auto pr-2">
                                {(dropdownParticipants || []).length === 0 ? (
                                  <li className="text-sm text-neutral-500">
                                    No participants
                                  </li>
                                ) : (
                                  (dropdownParticipants || []).map((p, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center space-x-3 p-2 rounded hover:bg-wwc-50"
                                    >
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-neutral-900">
                                          {p.user?.name || p.user}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                          {p.user?.email || ""}
                                        </div>
                                      </div>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          </div>,
                          document.body
                        )}
                    </td>
                    <td className="py-2 px-2 sm:px-3 md:px-4 text-xs sm:text-sm whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recordings modal */}
        {recordingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg font-semibold truncate">Recordings</h3>
                  <p className="text-xs text-neutral-500 truncate">
                    {currentMeetingForRecordings?.title ||
                      currentMeetingForRecordings?.meetingId}
                  </p>
                </div>
                <div>
                  <button
                    onClick={closeRecordings}
                    className="text-neutral-500 hover:text-neutral-700 text-xl sm:text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
                {recordingsLoading ? (
                  <div className="text-center text-xs sm:text-sm text-neutral-500">
                    Loading recordings…
                  </div>
                ) : recordingsError ? (
                  <div className="text-center text-xs sm:text-sm text-error-600">
                    {recordingsError}
                  </div>
                ) : recordingsList.length === 0 ? (
                  <div className="text-center text-xs sm:text-sm text-neutral-500">
                    No recordings found for this meeting.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="w-full sm:w-1/2 overflow-auto max-h-48 sm:max-h-56">
                      <ul className="space-y-2">
                        {recordingsList.map((r) => (
                          <li
                            key={r._id}
                            className={`p-2 rounded-md cursor-pointer border ${
                              selectedRecording &&
                              selectedRecording._id === r._id
                                ? "border-wwc-600 bg-wwc-50"
                                : "border-neutral-100"
                            }`}
                            onClick={() => setSelectedRecording(r)}
                          >
                            <div className="text-xs sm:text-sm font-medium text-neutral-900">
                              {new Date(r.uploadedAt).toLocaleString()}
                            </div>
                            <div className="text-[10px] sm:text-xs text-neutral-500">
                              {r.bytes
                                ? `${(r.bytes / 1024 / 1024).toFixed(2)} MB`
                                : "—"}{" "}
                              •{" "}
                              {r.duration ? `${Math.round(r.duration)}s` : "—"}
                            </div>
                            <div className="text-[10px] sm:text-xs text-neutral-400">
                              {r.status}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="w-full sm:w-1/2">
                      {selectedRecording ? (
                        <div>
                          <video
                            className="w-full h-32 sm:h-40 bg-black rounded"
                            controls
                            src={
                              selectedRecording.url_high ||
                              selectedRecording.url_low
                            }
                          />
                          <div className="mt-2 flex justify-between items-center text-[10px] sm:text-xs text-neutral-600">
                            <div>
                              {selectedRecording.duration
                                ? `${Math.round(selectedRecording.duration)}s`
                                : ""}
                            </div>
                            <div>
                              {selectedRecording.bytes
                                ? `${(
                                    selectedRecording.bytes /
                                    1024 /
                                    1024
                                  ).toFixed(2)} MB`
                                : ""}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-neutral-500">
                          Select a recording to preview
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 sm:p-3 border-t flex justify-end">
                <a
                  className={`inline-flex items-center text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded ${
                    selectedRecording
                      ? "bg-wwc-600 text-white hover:bg-wwc-700"
                      : "bg-neutral-100 text-neutral-600 cursor-not-allowed"
                  }`}
                  href={
                    selectedRecording
                      ? selectedRecording.url_high || selectedRecording.url_low
                      : "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!selectedRecording) e.preventDefault();
                  }}
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        )}

        {captionsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Captions</h3>
                </div>
                <div>
                  <button
                    onClick={() => setCaptionsModalOpen(false)}
                    className="text-neutral-500 hover:text-neutral-700 text-xl sm:text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4 overflow-auto flex-1">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm text-neutral-800">
                  {captionsModalContent}
                </pre>
              </div>
              <div className="p-2 sm:p-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(captionsModalContent || "");
                  }}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded bg-neutral-100"
                >
                  Copy
                </button>
                <a
                  href={
                    "data:text/plain;charset=utf-8," +
                    encodeURIComponent(captionsModalContent || "")
                  }
                  download={`captions-${Date.now()}.txt`}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded bg-wwc-600 text-white"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="text-red-600 mb-3 sm:mb-4 text-xs sm:text-sm">{error}</div>}
      {success && <div className="text-green-600 mb-3 sm:mb-4 text-xs sm:text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 md:mt-10">
        <div className="col-span-1 flex flex-col items-center p-3 sm:p-4 border rounded-lg">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="avatar"
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover mb-2 sm:mb-3"
            />
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl sm:text-4xl font-bold text-gray-600 mb-2 sm:mb-3">
              {form.name ? form.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="text-center">
            <div className="font-medium text-sm sm:text-base">{form.name || "Unnamed"}</div>
            <div className="text-xs sm:text-sm text-gray-500 break-all">{form.email}</div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 p-3 sm:p-4 border rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm bg-gray-50"
                  required
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                type="url"
                name="avatar"
                placeholder="https://..."
                value={form.avatar || ""}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={async () => {
                  // reset to last saved
                  if (user) {
                    setForm({
                      name: user.name || "",
                      email: user.email || "",
                      avatar: user.avatar || "",
                      role: user.role || "user",
                      preferences: user.preferences || {
                        defaultLanguage: "en",
                        captionsEnabled: true,
                      },
                    });
                    setAvatarPreview(user.avatar || "");
                    setError("");
                    setSuccess("");
                  } else if (loadUser) {
                    await loadUser();
                  }
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs sm:text-sm"
              >
                Reset
              </button>

              <button
                type="submit"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-xs sm:text-sm"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
</div>
  );
};

export default UserProfile;
