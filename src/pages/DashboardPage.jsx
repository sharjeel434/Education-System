
import { useEffect } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  GraduationCap,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  ADMIN_PATH_REDIRECTS,
  ADMIN_ROUTES,
} from "../components/admin/adminNavigation";
import { WorkspaceSidebarProvider } from "../components/workspace/SidebarContext";
import { appendAdminActivityRecord } from "../components/admin/adminData";
import StudentDashboard from "./dashboards/StudentDashboard";
import StudentDashboardHeader from "../components/student/StudentDashboardHeader";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import AdminLayout from "../components/admin/AdminLayout";

import "./AuthPages.css";

const DASHBOARDS = {
  Student: "/student/dashboard",
  Teacher: "/teacher/dashboard",
  Admin: "/admin/dashboard",
};

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = window.sessionStorage.getItem(
    "educonnect.demoRole"
  );

  const email = window.sessionStorage.getItem(
    "educonnect.demoEmail"
  );
  const isBlockedAdminRoute = Boolean(
    email && role && role !== "Admin" && location.pathname.startsWith("/admin/"),
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isBlockedAdminRoute) return;

    const dedupeKey = "educonnect.audit.lastBlockedAdminRoute";
    const now = Date.now();
    try {
      const previous = JSON.parse(window.sessionStorage.getItem(dedupeKey) || "null");
      if (
        previous?.role === role &&
        previous?.path === location.pathname &&
        now - Number(previous.timestamp || 0) < 1500
      ) return;
      window.sessionStorage.setItem(dedupeKey, JSON.stringify({ role, path: location.pathname, timestamp: now }));
    } catch {
      // Continue to record the access attempt if session storage is unavailable.
    }

    try {
      appendAdminActivityRecord({
        actor: email,
        actorRole: role,
        action: "Unauthorized Admin Route Access Blocked",
        category: "security",
        module: "Security & Access",
        entityType: "Admin Route",
        entityId: location.pathname,
        targetId: location.pathname,
        targetName: location.pathname,
        previousValue: role,
        newValue: "Blocked",
        description: `${role} account attempted to open an Admin route and was redirected. No session token or credential data was recorded.`,
        result: "Blocked",
        status: "Blocked",
      });
    } catch {
      // A local audit write failure must not interfere with the role redirect.
    }
  }, [email, isBlockedAdminRoute, location.pathname, role]);

  if (
    !email ||
    !["Student", "Teacher", "Admin"].includes(role)
  ) {
    return <Navigate to="/login" replace />;
  }

  if (role === "Admin" && ADMIN_PATH_REDIRECTS[location.pathname]) {
    return <Navigate to={ADMIN_PATH_REDIRECTS[location.pathname]} replace />;
  }

  const expectedPath = DASHBOARDS[role];
  const isRoleSubpage =
    ["Student", "Teacher"].includes(role) &&
    location.pathname.startsWith(`${expectedPath}/`);
  const isAdminSubpage =
    role === "Admin" && ADMIN_ROUTES.includes(location.pathname);

  if (
    location.pathname !== expectedPath &&
    !isRoleSubpage &&
    !isAdminSubpage
  ) {
    return <Navigate to={expectedPath} replace />;
  }

  function signOut() {
    window.sessionStorage.removeItem(
      "educonnect.demoEmail"
    );

    window.sessionStorage.removeItem(
      "educonnect.demoRole"
    );

    navigate("/login", { replace: true });
  }

  if (role === "Admin") {
    return <AdminLayout email={email} onLogout={signOut} />;
  }

  const welcomeTitle =
    role === "Teacher"
      ? "Welcome to your teaching space."
      : "Welcome to your learning space.";

  const welcomeDescription =
    role === "Teacher"
      ? "Create courses and manage your teaching journey."
      : "Explore courses and continue your learning journey.";

  const dashboardContent = (
    <>
      {role === "Student" ? <StudentDashboardHeader email={email} onLogout={signOut} /> : <header className="auth-topbar">
        <Link
          className="auth-brand"
          to="/"
          aria-label="EduConnect AI home"
        >
          <span className="auth-brand-icon">
            <GraduationCap size={22} />
          </span>

          <span>
            EduConnect <b>AI</b>
          </span>
        </Link>

        <div className="dashboard-account">
          <span className="dashboard-account-role">
            {role}
          </span>

          <span>{email}</span>

          <button
            type="button"
            onClick={signOut}
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>}

      <div className="dashboard-content">
        <section className="dashboard-welcome">
          <div>
            <span className="auth-eyebrow">
              <Sparkles size={14} />
              YOUR {role.toUpperCase()} DASHBOARD
            </span>

            <h1>{welcomeTitle}</h1>
            <p>{welcomeDescription}</p>
          </div>

          <div className="dashboard-welcome-icon">
            <GraduationCap size={48} />
          </div>
        </section>

        {role === "Student" && (
          <StudentDashboard email={email} />
        )}

        {role === "Teacher" && (
          <TeacherDashboard email={email} />
        )}

        <p className="dashboard-demo-note">
          Frontend demo only. Data is stored in
          this browser. Secure authentication,
          approvals, payments and shared data
          will be connected during backend
          development.
        </p>
      </div>

      <footer className="auth-footer">
        Copyright 2026 EduConnect AI
        <span>·</span>
        Learn something new today.
      </footer>
    </>
  );

  return (
    <main
      className={`auth-page dashboard-page ${
        role === "Teacher" ? "teacher-fullscreen-page" : ""
      }`}
    >
      {role === "Student" || role === "Teacher" ? (
        <WorkspaceSidebarProvider
          storageKey={`educonnect.sidebarCollapsed.${role.toLowerCase()}`}
        >
          {dashboardContent}
        </WorkspaceSidebarProvider>
      ) : dashboardContent}
    </main>
  );
}

export default DashboardPage;
