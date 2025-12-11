import React from "react";

const Meetingheaderbar = ({
  meetingId,
  activePanel,
  setActivePanel,
  mediaStream,
  socket,
  navigate,
  isMuted,
  user,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-200 px-6 py-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 ml-32">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-lg font-display">
                W
              </span>
            </div>
            <div>
              <h1 className="text-neutral-900 font-bold text-lg font-display">
                WWC Meeting
              </h1>
              <p className="text-neutral-600 text-sm font-mono">
                ID: {meetingId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-success-100 border border-success-200 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-success-700 text-sm font-medium">
              Connected
            </span>
          </div>
        </div>

        <div className="flex space-x-5 ml-96 mr-36">
          <button
            onClick={() =>
              setActivePanel(activePanel === "users" ? null : "users")
            }
            className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 border-2 border-black text-sm flex items-center space-x-1 ${
              activePanel === "users"
                ? "bg-gray-200 text-black shadow-soft"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            <svg
              className="w-6 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 6a3 3 0 106 0 3 3 0 00-6 0zM7 20a3 3 0 015.196-2.121M15 6a3 3 0 106 0 3 3 0 00-6 0z"
              />
            </svg>
            <span>Participants</span>
          </button>
          <button
            onClick={() =>
              setActivePanel(activePanel === "chat" ? null : "chat")
            }
            className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 border-2 border-black text-sm flex items-center space-x-1 ${
              activePanel === "chat"
                ? "bg-gray-200 text-black shadow-soft"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            <svg
              className="w-6 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Chat</span>
          </button>
          <button
            onClick={() => {
              if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
              }
              if (socket) {
                socket.disconnect();
              }
              navigate("/dashboard");
            }}
            className="bg-white text-black border-2 border-black px-2 py-1 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium text-sm flex items-center space-x-1"
          >
            <svg
              className="w-6 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Meetingheaderbar;
