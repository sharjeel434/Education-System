
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

import StudentDashboard from "./dashboards/StudentDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (
    !email ||
    !["Student", "Teacher", "Admin"].includes(role)
  ) {
    return <Navigate to="/login" replace />;
  }

  const expectedPath = DASHBOARDS[role];

  if (location.pathname !== expectedPath) {
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

  const welcomeTitle =
    role === "Teacher"
      ? "Welcome to your teaching space."
      : role === "Admin"
        ? "Welcome to the control center."
        : "Welcome to your learning space.";

  const welcomeDescription =
    role === "Teacher"
      ? "Create courses and manage your teaching journey."
      : role === "Admin"
        ? "Manage teachers, courses and platform activity."
        : "Explore courses and continue your learning journey.";

  
return (
    <main
      className={`auth-page dashboard-page ${
        role === "Teacher" ? "teacher-fullscreen-page" : ""
      }`}
    >

      <header className="auth-topbar">
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
      </header>

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

        {role === "Admin" && (
          <AdminDashboard />
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
    </main>
  );
}

export default DashboardPage;
