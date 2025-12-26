import React, { Suspense } from "react";
const Chat = React.lazy(() => import("./Chat.jsx"));
const AllUsers = React.lazy(() => import("./Participants.jsx"));

export default function MeetingSidePanel({ activePanel, socket, user, isMuted, participants, setActivePanel }) {
  return (
    <>
      {activePanel === "chat" && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-wwc-200 border-t-wwc-600"></div></div>}>
          <Chat socket={socket} onClose={() => setActivePanel(null)} />
        </Suspense>
      )}
      {activePanel === "users" && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-wwc-200 border-t-wwc-600"></div></div>}>
          <AllUsers user={user} isMuted={isMuted} participants={participants} onClose={() => setActivePanel(null)} />
        </Suspense>
      )}
    </>
  );
}
