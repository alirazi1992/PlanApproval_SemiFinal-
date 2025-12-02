import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthProvider,
  useAuth,
  UserRole,
  getHomePathForRole,
} from "./features/auth/AuthContext";
import { Login } from "./pages/Login";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { TechnicianDashboard } from "./pages/TechnicianDashboard";
import { ClientDashboard } from "./pages/ClientDashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Calendar } from "./pages/Calendar";
import { AuditLogs } from "./pages/AuditLogs";
import { SecurityLogs } from "./pages/SecurityLogs";
import { SettingsProfile } from "./pages/SettingsProfile";
import { SettingsSecurity } from "./pages/SettingsSecurity";
import { Messenger } from "./pages/Messenger";
import FastPass from "./pages/FastPass";
import TechnicianWorkspace from "./pages/TechnicianWorkspace";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles) {
    if (!roles.includes(user.role)) {
      return <Navigate to={getHomePathForRole(user.role)} replace />;
    }
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated ? (
    <Navigate to={getHomePathForRole(user?.role)} replace />
  ) : (
    <>{children}</>
  );
}

const allRoles: UserRole[] = ["admin", "technician", "client"];

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 🟦 صفحه لاگین */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* 🟩 صفحه Fast Pass ــ عمومی، بدون لاگین هم باز میشه */}
      <Route path="/fast-pass" element={<FastPass />} />

      {/* 🟥 داشبوردها */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute roles={["admin"]}>
            <ExecutiveDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/technician"
        element={
          <PrivateRoute roles={["technician"]}>
            <TechnicianDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace"
        element={
          <PrivateRoute roles={["technician", "admin"]}>
            <TechnicianWorkspace />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/client"
        element={
          <PrivateRoute roles={["client"]}>
            <ClientDashboard />
          </PrivateRoute>
        }
      />

      {/* 🟧 پروژه‌ها */}
      <Route
        path="/projects"
        element={
          <PrivateRoute roles={["admin", "technician"]}>
            <Projects />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute roles={["admin", "technician"]}>
            <ProjectDetail />
          </PrivateRoute>
        }
      />

      {/* 🟨 تقویم و لاگ‌ها */}
      <Route
        path="/calendar"
        element={
          <PrivateRoute roles={["admin"]}>
            <Calendar />
          </PrivateRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute roles={["admin"]}>
            <AuditLogs />
          </PrivateRoute>
        }
      />
      <Route
        path="/security-logs"
        element={
          <PrivateRoute roles={["admin"]}>
            <SecurityLogs />
          </PrivateRoute>
        }
      />

      {/* 🟪 تنظیمات */}
      <Route
        path="/settings/profile"
        element={
          <PrivateRoute roles={allRoles}>
            <SettingsProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <PrivateRoute roles={allRoles}>
            <SettingsSecurity />
          </PrivateRoute>
        }
      />

      {/* 🟫 مسنجر */}
      <Route
        path="/messenger"
        element={
          <PrivateRoute roles={["admin", "technician"]}>
            <Messenger />
          </PrivateRoute>
        }
      />

      {/* 🟦 روت اصلی */}
      <Route
        path="/"
        element={<Navigate to={getHomePathForRole(user?.role)} replace />}
      />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
