import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout/AppLayout";
import { Shell } from "./components/Shell/Shell";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { HomePage } from "./pages/HomePage/HomePage";
import { MessengerPage } from "./pages/MessengerPage/MessengerPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage/SettingsPage";
import { AboutPage } from "./pages/AboutPage/AboutPage";
import { ContactPage } from "./pages/ContactPage/ContactPage";
import { useAuth } from "./context/AuthContext";

// Redirects unauthenticated users to /login; shows a spinner while session is restoring.
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "4rem",
          color: "var(--color-text-muted, #888)",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* AppLayout provides the sticky Header and Footer for every route */}
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Shell provides the sidebar + 3-col grid for authenticated pages */}
        <Route
          element={
            <PrivateRoute>
              <Shell />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<HomePage />} />
          <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
