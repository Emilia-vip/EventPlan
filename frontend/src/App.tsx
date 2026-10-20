import { useCallback, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import type { AuthMode } from "./components/AuthPanel";
import { Footer, Header, Hero } from "./components/Layout";
import { MyTicketsPanel } from "./components/MyTicketsPanel";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { EventsRoute } from "./routes/events";


export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { user, checking, isAdmin, logout } = useAuth();
  const [creating, setCreating] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const openCreate = useCallback(() => setCreating(true), []);
  const closeCreate = useCallback(() => setCreating(false), []);
  const closeAuth = useCallback(() => setAuthMode(null), []);
  const closeTickets = useCallback(() => setTicketsOpen(false), []);

  function handleLogout() {
    logout();
    setCreating(false);
    setTicketsOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f5efe3] text-[#3b2a20]">
      <Header
        checking={checking}
        onCreate={isAdmin ? openCreate : undefined}
        onLogin={() => setAuthMode("login")}
        onLogout={handleLogout}
        onSignup={() => setAuthMode("signup")}
        onTickets={() => setTicketsOpen(true)}
        user={user}
      />
      <main>
        <Hero />
        <EventsRoute canCreate={isAdmin} creating={creating} onCloseCreate={closeCreate} onCreate={openCreate} onRequestAuth={setAuthMode} />
        <Footer />
      </main>
      {user && ticketsOpen && <MyTicketsPanel onClose={closeTickets} />}
      {!user && authMode && <AuthPanel mode={authMode} onClose={closeAuth} />}
    </div>
  );
}
