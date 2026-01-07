import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [addUserStatus, setAddUserStatus] = useState({});

  const [recordingsModalOpen, setRecordingsModalOpen] = useState(false);
  const [currentMeetingForRecordings, setCurrentMeetingForRecordings] =
    useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const [activityRange, setActivityRange] = useState(7);

  const [downloadFormat, setDownloadFormat] = useState("csv");

  const downloadUsers = (format) => {
    const fmt = format || downloadFormat;
    if (!users || users.length === 0) return;

    if (fmt === "csv") {
      const header = ["User ID", "Name", "Email", "Role", "Created At"];
      const rows = users.map((u, idx) => [
        idx + 1,
        u.name || "",
        u.email || "",
        u.role || "",
        new Date(u.createdAt).toLocaleString(),
      ]);
      const escape = (s) => `"${String(s).replace(/"/g, '""')}"`;
      const csv = [header, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      const lines = users.map(
        (u, idx) =>
          `${idx + 1}. ${u.name || ""} <${u.email || ""}> | ${
            u.role || ""
          } | ${new Date(u.createdAt).toLocaleString()}`
      );
      const blob = new Blob([lines.join("\n")], {
        type: "text/plain;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const [downloadMeetingsFormat, setDownloadMeetingsFormat] = useState("csv");

  const downloadMeetings = (format) => {
    const fmt = format || downloadMeetingsFormat;
    if (!meetings || meetings.length === 0) return;

    if (fmt === "csv") {
      const header = [
        "Meeting ID",
        "Title",
        "Host Name",
        "Host Email",
        "Status",
        "Participants",
        "Created At",
      ];
      const rows = meetings.map((m) => {
        const participants = (m.participants || [])
          .map((p) => `${p.name || p.user_id || p.id || p.user || ""} <${p.email || p.user_email || ""}>`)
          .join("; ");
        return [
          m.meetingId || "",
          m.title || "",
          m.host?.name || "",
          m.host?.email || "",
          m.status || "",
          participants,
          new Date(m.createdAt).toLocaleString(),
        ];
      });
      const escape = (s) => `"${String(s).replace(/"/g, '""')}"`;
      const csv = [header, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meetings-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
        const lines = meetings.map((m, idx) => {
        const participants = (m.participants || [])
          .map((p) => `${p.name || p.user_id || p.id || p.user || ""} <${p.email || p.user_email || ""}>`)
          .join("; ");
        return `${idx + 1}. ${m.title || ""} | ${m.meetingId || ""} | Host: ${
          m.host?.name || ""
        } <${m.host?.email || ""}> | Status: ${
          m.status || ""
        } | Participants: ${participants} | Created: ${new Date(
          m.createdAt
        ).toLocaleString()}`;
      });
      const blob = new Blob([lines.join("\n")], {
        type: "text/plain;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meetings-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const [captionsModalOpen, setCaptionsModalOpen] = useState(false);
  const [captionsModalContent, setCaptionsModalContent] = useState("");
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
    const dropdownWidth = 288;
    let left = rect.right - dropdownWidth;
    if (left < 8) left = rect.left;

    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: left + window.scrollX,
    });
    setDropdownParticipants(participants || []);
    setOpenParticipantsId(id);
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => (u.role || "").toLowerCase() === "admin").length;
    const regularUsers = users.filter((u) => u.role === "user").length;

    const totalMeetings = meetings.length;
    const scheduledMeetings = meetings.filter(
      (m) => m.status === "scheduled"
    ).length;
    const activeMeetings = meetings.filter((m) => m.status === "active").length;
    const endedMeetings = meetings.filter((m) => m.status === "ended").length;

    const totalParticipants = meetings.reduce((sum, m) => sum + (m.participants?.length || 0), 0);
    const activeParticipants = meetings.reduce((sum, m) => {
      const pats = m.participants || [];
      const activeCount = pats.filter((p) => Boolean(p.isActive || p.is_active)).length;
      return sum + activeCount;
    }, 0);

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
      totalUsers,
      adminUsers,
      regularUsers,
      totalMeetings,
      scheduledMeetings,
      activeMeetings,
      endedMeetings,
      totalParticipants,
      activeParticipants,
      activityDays: lastDays,
    };
  }, [users, meetings, activityRange]);

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    console.log("User info:", user);
    if (user?.role !== "admin") {
      setDataLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const usersRes = await api.get("/admin/users");
        setUsers(usersRes.data.users || []);
        const meetingsRes = await api.get("/admin/meetings");
        setMeetings(meetingsRes.data.data || []);

        console.log(usersRes);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();

    const handleAddUserToMeeting = async (meetingId, userId) => {
      setAddUserStatus((s) => ({
        ...s,
        [`${meetingId}_${userId}`]: "loading",
      }));
      try {
        const res = await api.post("/meeting/add-user", { meetingId, userId });
        if (res.data.success) {
          setAddUserStatus((s) => ({
            ...s,
            [`${meetingId}_${userId}`]: "success",
          }));
        } else {
          setAddUserStatus((s) => ({
            ...s,
            [`${meetingId}_${userId}`]: "error",
          }));
        }
      } catch {
        setAddUserStatus((s) => ({
          ...s,
          [`${meetingId}_${userId}`]: "error",
        }));
      }
    };
  }, [isAuthenticated, loading, user]);

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

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl flex items-center justify-center shadow-medium mb-4">
            <span className="text-white font-bold text-2xl font-display">
              W
            </span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-1.5 sm:mb-2">
        Admin Dashboard
      </h1>
      <h2 className="text-sm sm:text-base md:text-lg font-medium text-neutral-700 mb-6 sm:mb-8 truncate">
        Logged in as: {user?.name} ({user?.role})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-wwc-500 to-wwc-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3">
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
            <span className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Users</h3>
          <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">
            {stats.adminUsers} admins, {stats.regularUsers} users
          </p>
        </div>

        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3">
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
            <span className="text-2xl sm:text-3xl font-bold">{stats.totalMeetings}</span>
          </div>
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Meetings</h3>
        </div>

        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3">
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
            <span className="text-2xl sm:text-3xl font-bold">
              {stats.activeMeetings}
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90">
            Active Meeting
          </h3>
        </div>

        <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-xl sm:rounded-2xl shadow-medium p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-2xl sm:text-3xl font-bold">{stats.endedMeetings}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-medium opacity-90">Ended Meetings</h3>
          <p className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">Completed sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-medium border border-neutral-100 p-4 sm:p-5 md:p-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 mb-4 sm:mb-5 md:mb-6">
            Meeting Status Distribution
          </h2>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48">
              {stats.totalMeetings > 0 ? (
                <>
                  <svg
                    className="w-48 h-48 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {(() => {
                      const scheduled =
                        (stats.scheduledMeetings / stats.totalMeetings) * 100;
                      const active =
                        (stats.activeMeetings / stats.totalMeetings) * 100;
                      const ended =
                        (stats.endedMeetings / stats.totalMeetings) * 100;

                      let currentAngle = 0;
                      const createSlice = (percentage, color) => {
                        const angle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle = endAngle;

                        const startRad = ((startAngle - 90) * Math.PI) / 180;
                        const endRad = ((endAngle - 90) * Math.PI) / 180;

                        const x1 = 50 + 45 * Math.cos(startRad);
                        const y1 = 50 + 45 * Math.sin(startRad);
                        const x2 = 50 + 45 * Math.cos(endRad);
                        const y2 = 50 + 45 * Math.sin(endRad);

                        const largeArc = angle > 180 ? 1 : 0;

                        return `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      };

                      return (
                        <>
                          {scheduled > 0 && (
                            <path
                              d={createSlice(scheduled, "#3b82f6")}
                              fill="#3b82f6"
                            />
                          )}
                          {active > 0 && (
                            <path
                              d={createSlice(active, "#10b981")}
                              fill="#10b981"
                            />
                          )}
                          {ended > 0 && (
                            <path
                              d={createSlice(ended, "#6b7280")}
                              fill="#6b7280"
                            />
                          )}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-900">
                        {stats.totalMeetings}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-neutral-400">
                  No meetings yet
                </div>
              )}
            </div>
            <div className="ml-8 space-y-3">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-neutral-700">
                  Scheduled ({stats.scheduledMeetings})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-neutral-700">
                  Active ({stats.activeMeetings})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                <span className="text-sm text-neutral-700">
                  Ended ({stats.endedMeetings})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-medium border border-neutral-100 p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            User Roles Distribution
          </h2>
          <div className="h-48 flex items-end justify-around px-4">
            <div className="flex flex-col items-center w-1/3">
              <div
                className="w-full bg-wwc-100 rounded-t-lg overflow-hidden flex flex-col-reverse"
                style={{ height: "150px" }}
              >
                <div
                  className="bg-gradient-to-t from-wwc-500 to-wwc-600 transition-all duration-500 flex items-end justify-center"
                  style={{
                    height:
                      stats.totalUsers > 0
                        ? `${(stats.regularUsers / stats.totalUsers) * 100}%`
                        : "0%",
                    minHeight: stats.regularUsers > 0 ? "30px" : "0px",
                  }}
                >
                  <span className="text-white font-bold text-lg mb-2">
                    {stats.regularUsers}
                  </span>
                </div>
              </div>
              <span className="text-sm text-neutral-700 mt-2 font-medium">
                Regular Users
              </span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <div
                className="w-full bg-accent-100 rounded-t-lg overflow-hidden flex flex-col-reverse"
                style={{ height: "150px" }}
              >
                <div
                  className="bg-gradient-to-t from-accent-500 to-accent-600 transition-all duration-500 flex items-end justify-center"
                  style={{
                    height:
                      stats.totalUsers > 0
                        ? `${(stats.adminUsers / stats.totalUsers) * 100}%`
                        : "0%",
                    minHeight: stats.adminUsers > 0 ? "30px" : "0px",
                  }}
                >
                  <span className="text-white font-bold text-lg mb-2">
                    {stats.adminUsers}
                  </span>
                </div>
              </div>
              <span className="text-sm text-neutral-700 mt-2 font-medium">
                Admins
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-medium border border-neutral-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900">
            Meeting Activity
          </h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-neutral-600">Range:</label>
            <select
              value={activityRange}
              onChange={(e) => setActivityRange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>1 month</option>
              <option value={90}>3 months</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between px-4 overflow-x-auto">
          {stats.activityDays.map((day, index) => {
            const maxCount = Math.max(
              ...stats.activityDays.map((d) => d.count),
              1
            );
            const heightPercent = (day.count / maxCount) * 100;

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 mx-1 min-w-[48px]"
              >
                <div
                  className="w-full flex flex-col items-center justify-end"
                  style={{ height: "200px" }}
                >
                  {day.count > 0 && (
                    <span className="text-xs font-semibold text-wwc-700 mb-1">
                      {day.count}
                    </span>
                  )}
                  <div
                    className="w-full bg-gradient-to-t from-wwc-500 to-wwc-400 rounded-t-lg transition-all duration-500 hover:from-wwc-600 hover:to-wwc-500 cursor-pointer"
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: day.count > 0 ? "20px" : "0px",
                    }}
                    title={`${day.count} meetings on ${day.date}`}
                  ></div>
                </div>
                <span className="text-xs text-neutral-600 mt-2 font-medium">
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-medium border border-neutral-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-wwc-700">All Users</h2>
          <div className="flex items-center space-x-2">
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              <option value="csv">Excel (.csv)</option>
              <option value="txt">Text (.txt)</option>
            </select>
            <button
              onClick={() => downloadUsers()}
              className="px-3 py-1 rounded bg-wwc-600 text-white text-sm hover:bg-wwc-700"
            >
              Download
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="py-2 px-4 font-semibold">User ID</th>
                <th className="py-2 px-4 font-semibold">Name</th>
                <th className="py-2 px-4 font-semibold">Email</th>
                <th className="py-2 px-4 font-semibold">Role</th>
                <th className="py-2 px-4 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u._id} className="border-b">
                  <td className="py-2 px-4">{index + 1}</td>
                  <td className="py-2 px-4">{u.name}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4">{u.role}</td>
                  <td className="py-2 px-4">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recordingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Recordings</h3>
                <p className="text-xs text-neutral-500">
                  {currentMeetingForRecordings?.title ||
                    currentMeetingForRecordings?.meetingId}
                </p>
              </div>
              <div>
                <button
                  onClick={closeRecordings}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {recordingsLoading ? (
                <div className="text-center text-sm text-neutral-500">
                  Loading recordings…
                </div>
              ) : recordingsError ? (
                <div className="text-center text-sm text-error-600">
                  {recordingsError}
                </div>
              ) : recordingsList.length === 0 ? (
                <div className="text-center text-sm text-neutral-500">
                  No recordings found for this meeting.
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="w-1/2 overflow-auto max-h-56">
                    <ul className="space-y-2">
                      {recordingsList.map((r) => (
                        <li
                          key={r._id}
                          className={`p-2 rounded-md cursor-pointer border ${
                            selectedRecording && selectedRecording._id === r._id
                              ? "border-wwc-600 bg-wwc-50"
                              : "border-neutral-100"
                          }`}
                          onClick={() => setSelectedRecording(r)}
                        >
                          <div className="text-sm font-medium text-neutral-900">
                            {new Date(r.uploadedAt).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {r.bytes
                              ? `${(r.bytes / 1024 / 1024).toFixed(2)} MB`
                              : "—"}{" "}
                            • {r.duration ? `${Math.round(r.duration)}s` : "—"}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {r.status}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-1/2">
                    {selectedRecording ? (
                      <div>
                        <video
                          className="w-full h-40 bg-black rounded"
                          controls
                          src={
                            selectedRecording.url_high ||
                            selectedRecording.url_low
                          }
                        />
                        <div className="mt-2 flex justify-between items-center text-xs text-neutral-600">
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
                      <div className="text-sm text-neutral-500">
                        Select a recording to preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t flex justify-end">
              <a
                className={`inline-flex items-center text-sm font-medium px-3 py-1 rounded ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Captions</h3>
              </div>
              <div>
                <button
                  onClick={() => setCaptionsModalOpen(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: "64vh" }}>
              <pre className="whitespace-pre-wrap text-sm text-neutral-800">
                {captionsModalContent}
              </pre>
            </div>
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(captionsModalContent || "");
                }}
                className="mr-2 text-sm px-3 py-1 rounded bg-neutral-100"
              >
                Copy
              </button>
              <a
                href={
                  "data:text/plain;charset=utf-8," +
                  encodeURIComponent(captionsModalContent || "")
                }
                download={`captions-${Date.now()}.txt`}
                className="text-sm px-3 py-1 rounded bg-wwc-600 text-white"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-medium border border-neutral-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-wwc-700">
            All Meetings & Participants
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={downloadMeetingsFormat}
              onChange={(e) => setDownloadMeetingsFormat(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              <option value="csv">Excel (.csv)</option>
              <option value="txt">Text (.txt)</option>
            </select>
            <button
              onClick={() => downloadMeetings()}
              className="px-3 py-1 rounded bg-wwc-600 text-white text-sm hover:bg-wwc-700"
            >
              Download
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="py-2 px-4 font-semibold">Meeting ID</th>
                <th className="py-2 px-4 font-semibold">Title</th>
                <th className="py-2 px-4 font-semibold">Host Name</th>
                <th className="py-2 px-4 font-semibold">Host Email</th>
                <th className="py-2 px-4 font-semibold">Status</th>
                <th className="py-2 px-4 font-semibold">Participants</th>
                <th className="py-2 px-4 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.meetingId || m._id} className="border-b">
                  <td className="py-2 px-4">
                    {m.meetingId?.split("-")[0] || m.meetingId}
                  </td>
                  <td className="py-2 px-4">{m.title}</td>
                  <td className="py-2 px-4">{m.host?.name || m.host}</td>
                  <td className="py-2 px-4">{m.host?.email || ""}</td>
                  <td className="py-2 px-4">
                    {m.status === "ended" && (
                      <span className="text-error-700 font-semibold">
                        Ended
                      </span>
                    )}
                    {m.status === "scheduled" && (
                      <span className="text-wwc-700 font-semibold">
                        Scheduled
                      </span>
                    )}
                    {m.status === "active" && (
                      <span className="text-success-700 font-semibold">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-4 relative">
                    <div className="inline-block">
                      <button
                        onClick={(e) =>
                          toggleParticipants(e, m.meetingId || m._id, m.participants)
                        }
                        className="flex items-center space-x-2 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm border"
                      >
                        <span>{(m.participants || []).length}</span>
                        <span className="text-neutral-600">Participants</span>
                        <svg
                          className="w-4 h-4 text-neutral-500"
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

                    {openParticipantsId === (m.meetingId || m._id) &&
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
                                        {p.name || p.user_id || p.id || p.user}
                                      </div>
                                      <div className="text-xs text-neutral-500">
                                        {p.email || p.user_email || ""}
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
                  <td className="py-2 px-4">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
