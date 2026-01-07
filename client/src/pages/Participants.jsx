import React, { useRef, useState } from "react";

const AllUsers = ({ user, isMuted, participants, onClose, loading = false }) => {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);

  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };


  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div ref={rootRef} className="pointer-events-auto z-50 w-full sm:w-[340px] md:w-[380px] h-[500px] sm:h-[580px] md:h-[620px] max-h-[calc(100vh-120px)] bg-white border-2 border-black rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-16">
      <div className="p-3 sm:p-4 border-b-2 border-black bg-gradient-to-r from-wwc-600 to-wwc-700 flex items-center justify-between">
        <h3 className="text-white font-display text-base sm:text-lg">Participants ({1 + (participants?.length || 0)})</h3>
        <div className="flex items-center space-x-2">
          <button onClick={handleClose} aria-label="Close participants" className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-wwc-50 rounded-lg sm:rounded-xl border border-wwc-200 w-full relative">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm sm:text-base">{user?.name?.[0] || "U"}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-neutral-900 text-sm sm:text-base truncate">{user?.name || "You"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <div className="bg-error-500 text-black px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-0.5 sm:space-x-1 shadow-lg">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            {!isMuted ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-success-600 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-error-600 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V5a2 2 0 012-2h2m0 0V2a1 1 0 112 0v1m2 0h2a2 2 0 012 2v4.586m0 0V9a1 1 0 011 1v4a1 1 0 01-1 1h-1M9 12l2 2 4-4" />
                </svg>
              </div>
            )}
          </div>
        </div>
        {participants &&
          participants.map((p) => (
            <div key={p.socketId} className="flex items-center justify-between p-2.5 sm:p-3 bg-neutral-100 rounded-lg sm:rounded-xl border border-neutral-200 w-full relative">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-wwc-400 to-wwc-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm sm:text-base">{p.userName?.[0] || "U"}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900 text-sm sm:text-base truncate">{p.userName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                <div className="bg-error-500 text-black px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-0.5 sm:space-x-1 shadow-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"></div>
                  <span>LIVE</span>
                </div>

                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-success-600 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-wwc-200 border-t-wwc-600"></div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AllUsers;
