import React, { useState } from "react";
import meetingService from "../../services/meetingService";
import notify from '../../utils/notifications';

const Controlbar = ({
  isMuted,
  isVideoOn,
  showCaptions,
  selectedLanguage,
  isScreenSharing,
  endingMeeting,
  endMeetingError,
  toggleMute,
  toggleVideo,
  toggleCaptions,
  setSelectedLanguage,
  toggleScreenShare,
  handleEndMeeting,
  isCreator,
  isRecording,
  onStartRecording,
  onStopRecording,
  isUploadingRecording,
  activePanel,
  setActivePanel,
  mediaStream,
  socket,
  navigate,
  user,
  meetingId,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLeave = async () => {
    try {
      if (meetingId) {
        await meetingService.leaveMeeting(meetingId);
      }
    } catch (err) {
      console.warn("Error calling leave endpoint:", err);
    }
    try {
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    } catch (e) {}
    try {
      if (socket) {
        try {
          socket.emit("leave-meeting");
        } catch (e) {}
        try {
          socket.disconnect();
        } catch (e) {}
      }
    } catch (e) {}
    if (navigate) navigate("/dashboard");
  };

  const handleShare = async () => {
    const meetingLink = `${window.location.origin}/meeting/${meetingId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my meeting",
          text: "Join my meeting",
          url: meetingLink,
        });
        return;
      } catch (e) {
        console.log("error in share button", e);
      }
    }

    try {
      await navigator.clipboard.writeText(meetingLink);
      notify.success("Meeting link copied to clipboard!");
    } catch (err) {
      console.error("Could not copy text: ", err);
      notify.error("Failed to copy link. Please copy manually: " + meetingLink);
    }

    setShowShareMenu(true);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white via-wwc-50 to-white border-t-2 border-wwc-700 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 shadow-hard">

        {showMoreMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-gradient-to-br from-white to-wwc-50 border-2 border-wwc-700 rounded-lg shadow-hard p-1.5 md:hidden overflow-x-auto">
          <div className="flex items-center justify-center space-x-1.5 w-full">
            {/* Participants */}
            <button
              onClick={() => {
                setActivePanel(activePanel === "users" ? null : "users");
                setShowMoreMenu(false);
              }}
              className={`p-1.5 rounded-md font-medium transition-all duration-200 border-2 border-wwc-700 flex items-center justify-center ${
                activePanel === "users"
                  ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white shadow-soft"
                  : "bg-white text-wwc-700 hover:bg-wwc-50"
              }`}
              title="Participants"
            >
            <svg
  className="w-4 h-4"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2"
  />
  <circle cx="8" cy="7" r="3" />
  <circle cx="16" cy="7" r="3" />
  <circle cx="12" cy="5" r="4" />
</svg>

            </button>

            {/* Chat */}
            <button
              onClick={() => {
                setActivePanel(activePanel === "chat" ? null : "chat");
                setShowMoreMenu(false);
              }}
              className={`p-1.5 rounded-md font-medium transition-all duration-200 border-2 border-wwc-700 flex items-center justify-center ${
                activePanel === "chat"
                  ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white shadow-soft"
                  : "bg-white text-wwc-700 hover:bg-wwc-50"
              }`}
              title="Chat"
            >
              <svg
                className="w-4 h-4"
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
            </button>

            {/* Share */}
            <button
              onClick={() => {
                handleShare();
                setShowMoreMenu(false);
              }}
              className="p-1.5 rounded-md font-medium transition-all duration-200 border-2 border-wwc-700 flex items-center justify-center bg-white text-wwc-700 hover:bg-wwc-50"
              title="Share"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            {showShareMenu && (
              <div className="absolute bottom-full left-2 mb-2 bg-white border-2 border-wwc-700 rounded-md shadow-soft p-2 z-50">
                <div className="flex space-x-2 items-center">
                  <a
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Join my meeting: " + `${window.location.origin}/meeting/${meetingId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/meeting/${meetingId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Facebook
                  </a>
                  <a
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join my meeting:")}&url=${encodeURIComponent(`${window.location.origin}/meeting/${meetingId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Twitter
                  </a>
                  <a
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/meeting/${meetingId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                    href={`mailto:?subject=${encodeURIComponent("Join my meeting")}&body=${encodeURIComponent(`${window.location.origin}/meeting/${meetingId}`)}`}
                    target="_self"
                  >
                    Email
                  </a>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/meeting/${meetingId}`;
                      navigator.clipboard.writeText(link).then(() => {
                        notify.success("Meeting link copied to clipboard!");
                      });
                    }}
                    className="px-2 py-1 rounded-md bg-wwc-50 text-wwc-700 text-sm"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setShowShareMenu(false)}
                    className="px-2 py-1 rounded-md bg-white text-wwc-700 text-sm border-2 border-wwc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Captions */}
            <button
              onClick={() => {
                toggleCaptions();
                setShowMoreMenu(false);
              }}
              className={`p-1.5 rounded-md font-medium transition-all duration-200 border-2 border-wwc-700 flex items-center justify-center ${
                showCaptions
                  ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white shadow-soft"
                  : "bg-white text-wwc-700 hover:bg-wwc-50"
              }`}
              title={showCaptions ? "Hide Captions" : "Show Captions"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2M7 4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1M7 4h10M9 12h6m-6 4h6"
                />
              </svg>
            </button>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedLanguage(e.target.value);
              }}
              className="px-1.5 py-1 rounded-md border-2 border-wwc-700 bg-white text-wwc-700 focus:outline-none focus:ring-2 focus:ring-wwc-500 transition-all duration-200 text-[10px] font-medium"
              title="Select Language"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ru">Russian</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
              <option value="te">Telugu</option>
              <option value="ml">Malayalam</option>
              <option value="kn">Kannada</option>
              <option value="pa">Punjabi</option>
              <option value="gu">Gujarati</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-4">
        {/* Desktop view - all buttons visible */}
        <div className="hidden md:flex items-center space-x-2 mr-4">
          <button
            onClick={() =>
              setActivePanel(activePanel === "users" ? null : "users")
            }
            className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 border-2 border-wwc-700 text-sm flex items-center space-x-2 ${
              activePanel === "users"
                ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white shadow-soft"
                : "bg-white text-wwc-700 hover:bg-wwc-50"
            }`}
            title="Participants"
          >
            <svg
              className="w-4 h-4"
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
            className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 border-2 border-wwc-700 text-sm flex items-center space-x-2 ${
              activePanel === "chat"
                ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white shadow-soft"
                : "bg-white text-wwc-700 hover:bg-wwc-50"
            }`}
            title="Chat"
          >
            <svg
              className="w-4 h-4"
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
            onClick={handleShare}
            className="px-3 py-2 rounded-lg font-medium transition-all duration-200 border-2 border-wwc-700 text-sm flex items-center space-x-2 bg-white text-wwc-700 hover:bg-wwc-50"
            title="Share"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Share</span>
          </button>
        </div>

        {/* Mobile view - three dot menu button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="md:hidden p-2 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-wwc-700 bg-white text-wwc-700 hover:bg-wwc-50"
          title="More options"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {/* Mute Button - Always visible */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMute();
          }}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-wwc-700 ${
            isMuted
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
              : "bg-white text-wwc-700 hover:bg-wwc-50"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Microphone icon */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
            {/* Slash overlay when muted */}
            {isMuted && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.5 18.5L18.5 5.5"
              />
            )}
          </svg>
        </button>

        {/* Video Button - Always visible */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleVideo();
          }}
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-wwc-700 ${
            !isVideoOn
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
              : "bg-white text-wwc-700 hover:bg-wwc-50"
          }`}
          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Camera icon */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
            {/* Slash overlay when camera is off */}
            {!isVideoOn && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.5 18.5L18.5 5.5"
              />
            )}
          </svg>
        </button>

        {/* Desktop-only controls */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCaptions();
          }}
          className={`hidden md:flex px-3 py-2 rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-wwc-700 ${
            showCaptions
              ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white"
              : "bg-white text-wwc-700 hover:bg-wwc-50"
          }`}
        >
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2M7 4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1M7 4h10M9 12h6m-6 4h6"
              />
            </svg>
            <span className="text-sm">{showCaptions ? "Hide" : "Show"}</span>
          </div>
        </button>

        <div className="hidden md:flex items-center space-x-1">
          <label className="text-sm font-medium text-wwc-700">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => {
              e.stopPropagation();
              setSelectedLanguage(e.target.value);
            }}
            className="px-2 py-1 rounded-xl border-2 border-wwc-700 bg-white text-wwc-700 focus:outline-none focus:ring-2 focus:ring-wwc-500 transition-all duration-200 text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ru">Russian</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="bn">Bengali</option>
            <option value="te">Telugu</option>
            <option value="ml">Malayalam</option>
            <option value="kn">Kannada</option>
            <option value="pa">Punjabi</option>
            <option value="gu">Gujrati</option>
            <option value="mr">Marathi</option>
          </select>
        </div>

        {/* Screen Share - Desktop only */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleScreenShare();
          }}
          className={`hidden md:flex p-2 rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-wwc-700 ${
            isScreenSharing
              ? "bg-gradient-to-br from-wwc-600 to-wwc-700 text-white"
              : "bg-white text-wwc-700 hover:bg-wwc-50"
          }`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6.75C3 5.231 4.231 4 5.75 4h12.5C19.769 4 21 5.231 21 6.75v8.5C21 16.769 19.769 18 18.25 18H13l1.125 2.25H9.875L11 18H5.75C4.231 18 3 16.769 3 15.25v-8.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.75 21h6.5"
            />
          </svg>
        </button>

        {/* Record Meeting - Desktop only */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isRecording) onStopRecording();
            else onStartRecording();
          }}
          className={`hidden md:flex px-2 py-2 rounded-lg font-semibold transition-all duration-150 shadow-soft hover:shadow-medium border-2 border-wwc-700 ${
            isRecording
              ? "bg-gradient-to-br from-red-600 to-red-700 text-white"
              : "bg-white text-wwc-700 hover:bg-wwc-50"
          }`}
          title={isRecording ? "Stop recording" : "Record meeting"}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6" />
            </svg>
            <span className="text-xs">{isRecording ? "Stop" : "Record"}</span>
          </div>
        </button>

        {/* End Meeting (host) or Leave (others) - Always visible */}
        {isCreator ? (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEndMeeting();
              }}
              disabled={endingMeeting}
              className="px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold bg-error-600 text-white shadow-soft border-2 border-error-700 hover:bg-error-700 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
              title="End Meeting"
            >
              {endingMeeting ? "Ending..." : <span className="hidden xs:inline">End Meeting</span>}
              {!endingMeeting && <span className="xs:hidden">End</span>}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLeave();
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold bg-white text-wwc-700 shadow-soft border-2 border-wwc-700 hover:bg-wwc-50 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
              title="Leave Meeting"
            >
              Leave
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLeave();
            }}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold bg-white text-wwc-700 shadow-soft border-2 border-wwc-700 hover:bg-wwc-50 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
            title="Leave Meeting"
          >
            Leave
          </button>
        )}
        {endMeetingError && (
          <span className="text-error-600 ml-1 sm:ml-2 md:ml-4 font-semibold text-xs sm:text-sm">
            {endMeetingError}
          </span>
        )}
      </div>
    </div>
  );
};

export default Controlbar;
