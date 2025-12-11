import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Chat = ({ socket: externalSocket, onClose }) => {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);

  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const sock = externalSocket;
    if (!sock) return;

    const onChatMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || msg.timestamp || Date.now(),
          sender: msg.senderName || "User",
          text: msg.text,
          timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString(),
          senderId: msg.senderId,
        },
      ]);
    };

    const onChatHistory = (history) => {
      const mapped = (history || []).map((m) => ({
        id: m.id || m.timestamp || Math.random(),
        sender: m.senderName || "User",
        text: m.text,
        timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString(),
        senderId: m.senderId,
      }));
      setMessages(mapped);
    };

    sock.on("chat-message", onChatMessage);
    sock.on("chat-history", onChatHistory);
    sock.emit("get-chat-history");
    return () => {
      sock.off("chat-message", onChatMessage);
      sock.off("chat-history", onChatHistory);
    };
  }, [externalSocket]);

  const containerRef = useRef(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;
      autoScrollRef.current = atBottom;
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (autoScrollRef.current) {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch (err) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setLoading(false);
  }, [authLoading, isAuthenticated, meetingId, navigate]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    const el = containerRef.current;
    const wasAtBottom = el
      ? el.scrollHeight - el.scrollTop <= el.clientHeight + 20
      : true;

    if (externalSocket) {
      externalSocket.emit("send-chat-message", { text: newMessage });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: user?.name || "You",
          text: newMessage,
          timestamp: new Date().toLocaleTimeString(),
          senderId: user?.id,
        },
      ]);
    }
    setNewMessage("");

    if (wasAtBottom && el) {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch (err) {
        el.scrollTop = el.scrollHeight;
      }
    }
  };

  const handleDeleteMessage = (id) => {
    // delete message removed — function kept intentionally empty in case
    // other code expects it; actual delete UI has been removed.
  };

  const goBackToMeeting = () => {
    navigate(`/meeting/${meetingId}`);
  };

  if (!visible) return null;

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4">
        <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
        <div ref={rootRef} className="pointer-events-auto z-50 w-full sm:w-[340px] md:w-[380px] h-[500px] sm:h-[580px] md:h-[620px] max-h-[calc(100vh-120px)] bg-white border-2 border-black rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute top-3 right-3">
            <button onClick={handleClose} aria-label="Close chat" className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="text-center animate-fade-in w-full">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-3xl flex items-center justify-center shadow-hard mb-6">
              <div className="animate-pulse-soft">
                <span className="text-white font-bold text-2xl font-display">W</span>
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-500 mx-auto mb-4"></div>
            <p className="text-neutral-900 font-semibold text-lg">Loading Chat...</p>
          </div>
        </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div ref={rootRef} className="pointer-events-auto z-50 w-full sm:w-[340px] md:w-[380px] h-[500px] sm:h-[580px] md:h-[620px] max-h-[calc(100vh-120px)] bg-white border-2 border-black rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-16">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b-2 border-black bg-gradient-to-r from-wwc-600 to-wwc-700 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-base sm:text-lg">Chat Room</h3>
            <p className="text-[10px] sm:text-xs text-white/80 truncate">Team messages & discussion</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={goBackToMeeting}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-white/20 text-white text-xs sm:text-sm hover:bg-white/30"
          >
            Top
          </button>
          <button onClick={handleClose} aria-label="Close chat" className="px-2.5 sm:px-3 py-1 rounded-lg bg-white/20 text-white text-xs sm:text-sm hover:bg-white/30">
            ✕
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 bg-neutral-50 space-y-3 sm:space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400"
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
            </div>
            <p className="text-neutral-500 text-sm sm:text-base font-semibold">
              No messages yet
            </p>
            <p className="text-neutral-400 text-[10px] sm:text-xs mt-1">
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn =
              message.senderId === user?.id || message.sender === user?.name;
            return (
              <div
                key={message.id || index}
                className={`flex items-start ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {!isOwn && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {message.sender?.[0] || "U"}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[180px] sm:max-w-[220px] md:max-w-[240px] ${
                    isOwn ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                        {message.sender}
                      </p>
                      <p className="text-[10px] sm:text-xs text-neutral-400 whitespace-nowrap">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`${
                      isOwn ? "bg-wwc-600 text-white" : "bg-white"
                    } rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 border ${
                      isOwn ? "border-wwc-600" : "border-neutral-200"
                    } shadow-sm`}
                  >
                    <p
                      className={`leading-relaxed text-xs sm:text-sm break-words ${
                        isOwn ? "" : "text-neutral-700"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
                {isOwn && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {message.sender?.[0] || "U"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Chat Input */}
      <div className="p-2.5 sm:p-3 border-t-2 border-black bg-white">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-1.5 sm:space-x-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-neutral-200 rounded-lg sm:rounded-xl text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-wwc-600 focus:border-wwc-600 transition-all duration-200 bg-neutral-50 shadow-sm text-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium text-xs sm:text-sm ${
              newMessage.trim()
                ? "bg-wwc-600 text-white border-wwc-700"
                : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
            }`}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-0.5 sm:mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="align-middle hidden xs:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};

export default Chat;
