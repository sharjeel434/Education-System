import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminDashboard from "../../pages/dashboards/AdminDashboard";
import AdminActivityLog from "./AdminActivityLog";
import AdminAnalytics from "./AdminAnalytics";
import AdminSettings from "./AdminSettings";
import AdminCourseReview from "./AdminCourseReview";
import AdminDataExport from "./AdminDataExport";
import AdminDataImport from "./AdminDataImport";
import AdminKnowledgeGovernance from "./AdminKnowledgeGovernance";
import AdminNotifications from "./AdminNotifications";
import AdminModulePlaceholder from "./AdminModulePlaceholder";
import AdminOverview from "./AdminOverview";
import AdminSystemHealth from "./AdminSystemHealth";
import AdminSupportModeration from "./AdminSupportModeration";
import AdminTeacherApplications from "./AdminTeacherApplications";
import AdminUserManagement from "./AdminUserManagement";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import {
  ADMIN_DATA_CHANGED_EVENT,
  getAdminNotifications,
} from "./adminNotificationData";
import { ADMIN_SECTIONS } from "./adminNavigation";
import {
  ADMIN_PREFERENCES_CHANGED_EVENT,
  getAdminPreferences,
} from "./adminSettings";
import "./Admin.css";

const EXISTING_ADMIN_SECTIONS = new Set([]);

function AdminLayout({ email, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [preferences, setPreferences] = useState(getAdminPreferences);
  const [notificationData, setNotificationData] = useState(getAdminNotifications);
  const section =
    ADMIN_SECTIONS.find((item) => item.path === location.pathname) ??
    ADMIN_SECTIONS[0];

  useEffect(() => {
    function refreshPreferences() {
      setPreferences(getAdminPreferences());
    }

    window.addEventListener("storage", refreshPreferences);
    window.addEventListener(
      ADMIN_PREFERENCES_CHANGED_EVENT,
      refreshPreferences,
    );

    return () => {
      window.removeEventListener("storage", refreshPreferences);
      window.removeEventListener(
        ADMIN_PREFERENCES_CHANGED_EVENT,
        refreshPreferences,
      );
    };
  }, []);

  useEffect(() => {
    function refreshNotifications() {
      setNotificationData(getAdminNotifications());
    }

    window.addEventListener("storage", refreshNotifications);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshNotifications);

    return () => {
      window.removeEventListener("storage", refreshNotifications);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshNotifications);
    };
  }, []);

  function renderContent() {
    if (section.id === "dashboard") {
      return <AdminOverview />;
    }

    if (section.id === "teachers") {
      return <AdminTeacherApplications />;
    }

    if (section.id === "courses") {
      return <AdminCourseReview />;
    }

    if (section.id === "knowledge") {
      return <AdminKnowledgeGovernance />;
    }

    if (section.id === "users") {
      return <AdminUserManagement />;
    }

    if (section.id === "support") {
      return <AdminSupportModeration email={email} />;
    }

    if (section.id === "reports") {
      return <AdminAnalytics />;
    }

    if (section.id === "data-export") {
      return <AdminDataExport />;
    }

    if (section.id === "data-import") {
      return <AdminDataImport email={email} />;
    }

    if (section.id === "activity-log") {
      return <AdminActivityLog />;
    }

    if (section.id === "notifications") {
      return (
        <AdminNotifications
          notifications={notificationData.notifications}
          errors={notificationData.errors}
        />
      );
    }

    if (section.id === "settings") {
      return (
        <AdminSettings
          key={preferences.density}
          preferences={preferences}
        />
      );
    }

    if (section.id === "system-health") {
      return <AdminSystemHealth email={email} />;
    }


    if (EXISTING_ADMIN_SECTIONS.has(section.id)) {
      return (
        <AdminDashboard
          key={section.id}
          initialTab={section.id}
          onSectionChange={(tab) => {
            const paths = {
              teachers: "/admin/teachers",
              approvals: "/admin/courses",
              users: "/admin/users",
              courses: "/admin/courses",
              reports: "/admin/reports",
            };
            const path = paths[tab];
            if (path) navigate(path);
          }}
        />
      );
    }

    return (
      <AdminModulePlaceholder
        title={section.title}
        description={section.description}
      />
    );
  }

  return (
    <div className={`edc-admin-layout${preferences.density === "compact" ? " edc-admin-layout-compact" : ""}`}>
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="edc-admin-main">
        <AdminTopbar
          email={email}
          isMenuOpen={mobileSidebarOpen}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onLogout={onLogout}
          notifications={notificationData.notifications}
          notificationErrors={notificationData.errors}
        />
        <main className="edc-admin-content">
          <section className="edc-admin-page-heading">
            <div>
              <span className="edc-admin-page-eyebrow">ADMIN WORKSPACE</span>
              <h2>{section.pageTitle ?? section.title}</h2>
              <p>{section.description}</p>
            </div>
          </section>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
