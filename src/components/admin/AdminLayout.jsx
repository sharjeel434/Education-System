import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminActivityLog from "./AdminActivityLog";
import AdminAnalytics from "./AdminAnalytics";
import AdminAIOperations from "./AdminAIOperations";
import AdminFinancialManagement from "./AdminFinancialManagement";
import AdminSecurity from "./AdminSecurity";
import AdminSettings from "./AdminSettings.jsx";
import AdminCourseReview from "./AdminCourseReview";
import AdminBookApprovals from "./AdminBookApprovals";
import AdminDataExport from "./AdminDataExport";
import AdminDataImport from "./AdminDataImport";
import AdminKnowledgeGovernance from "./AdminKnowledgeGovernance";
import AdminModerationGovernance from "./AdminModerationGovernance";
import AdminNotifications from "./AdminNotifications";
import AdminModulePlaceholder from "./AdminModulePlaceholder";
import AdminOverview from "./AdminOverview";
import AdminSystemHealth from "./AdminSystemHealth";
import AdminSupportModeration from "./AdminSupportModeration";
import AdminTeacherApplications from "./AdminTeacherApplications";
import AdminIdentityVerifications from "./AdminIdentityVerifications";
import AdminTutorMarketplace from "./AdminTutorMarketplace";
import AdminUserManagement from "./AdminUserManagement";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import {
  ADMIN_DATA_CHANGED_EVENT,
  getAdminNotifications,
} from "./adminNotificationData";
import { appendAdminActivityRecord } from "./adminData";
import { ADMIN_SECTIONS } from "./adminNavigation";
import {
  ADMIN_PREFERENCES_CHANGED_EVENT,
  getAdminPreferences,
} from "./adminSettings";
import {
  ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT,
  getAdminPlatformSettings,
} from "./adminPlatformSettings";
import "./Admin.css";
import "./AdminColorTheme.css";
import "../SectionTypography.css";
import "../DashboardCardClarity.css";

function AdminLayout({ email, onLogout }) {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [preferences, setPreferences] = useState(getAdminPreferences);
  const [platformSettings, setPlatformSettings] = useState(getAdminPlatformSettings);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  const [notificationData, setNotificationData] = useState(getAdminNotifications);
  const section =
    ADMIN_SECTIONS.find((item) => item.path === location.pathname) ??
    ADMIN_SECTIONS[0];
  const notificationPreferences = platformSettings.notifications;
  const visibleNotifications = notificationData.notifications.filter((notification) => {
    if (notification.category === "teacher") return notificationPreferences.newTeacherApplicationAlerts;
    if (notification.category === "course") return notificationPreferences.courseApprovalAlerts;
    if (notification.category === "support") return notificationPreferences.studentHelpRequestAlerts;
    return true;
  });

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
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const updateSystemTheme = (event) => setSystemPrefersDark(event.matches);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    function refreshPlatformSettings() {
      setPlatformSettings(getAdminPlatformSettings());
    }

    window.addEventListener("storage", refreshPlatformSettings);
    window.addEventListener(ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT, refreshPlatformSettings);
    return () => {
      window.removeEventListener("storage", refreshPlatformSettings);
      window.removeEventListener(ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT, refreshPlatformSettings);
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const favicon = document.querySelector('link[rel="icon"]');
    const previousFavicon = favicon?.getAttribute("href");
    document.title = platformSettings.general.websiteName || "EduConnect AI";
    if (platformSettings.general.faviconUrl) {
      const iconLink = favicon || document.createElement("link");
      iconLink.rel = "icon";
      iconLink.href = platformSettings.general.faviconUrl;
      if (!favicon) document.head.appendChild(iconLink);
    }
    return () => {
      document.title = previousTitle;
      if (favicon && previousFavicon) favicon.setAttribute("href", previousFavicon);
      else if (favicon && !previousFavicon) favicon.removeAttribute("href");
    };
  }, [platformSettings.general.websiteName, platformSettings.general.faviconUrl]);

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
      return <AdminOverview email={email} />;
    }

    if (section.id === "teachers") {
      return <AdminTeacherApplications />;
    }
    if (section.id === "identity-verification") return <AdminIdentityVerifications />;

    if (section.id === "courses") {
      return <AdminCourseReview />;
    }

    if (section.id === "books") return <AdminBookApprovals />;
    if (section.id === "help-requests") return <AdminSupportModeration email={email} initialView="students" />;

    if (section.id === "knowledge") {
      return <AdminKnowledgeGovernance />;
    }

    if (section.id === "users") {
      return <AdminUserManagement key={location.search} />;
    }

    if (section.id === "tutors") {
      return <AdminTutorMarketplace email={email} />;
    }

    if (section.id === "finance") {
      return <AdminFinancialManagement email={email} />;
    }

    if (section.id === "ai-operations") {
      return <AdminAIOperations email={email} />;
    }

    if (section.id === "support" || section.parentId === "support") {
      return (
        <AdminSupportModeration
          key={section.path}
          email={email}
          initialView={section.supportView || "overview"}
          detailPage={Boolean(section.parentId)}
        />
      );
    }

    if (section.id === "moderation") {
      return <AdminModerationGovernance email={email} />;
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
          notifications={visibleNotifications}
          errors={notificationData.errors}
        />
      );
    }

    if (section.id === "settings") {
      return (
        <AdminSettings
          preferences={preferences}
          platformSettings={platformSettings}
        />
      );
    }

    if (section.id === "security" || section.parentId === "security") {
      return (
        <AdminSecurity
          email={email}
          onLogout={onLogout}
          view={section.securityView ?? "overview"}
        />
      );
    }

    if (section.id === "system-health") {
      return <AdminSystemHealth email={email} />;
    }


    return (
      <AdminModulePlaceholder
        title={section.title}
        description={section.description}
      />
    );
  }

  function handleAdminLogout() {
    try {
      appendAdminActivityRecord({
        actor: email || "Admin",
        actorRole: "Admin",
        action: "Admin Logout",
        category: "security",
        module: "Security & Access",
        entityType: "Admin Session",
        entityId: email || "active-session",
        targetId: email || "active-session",
        targetName: "Admin session",
        description: "Admin ended the browser session from the workspace header. No session token was recorded.",
        result: "Success",
      });
    } catch {
      // Logging must not block the existing logout flow.
    }
    onLogout?.();
  }

  return (
    <div className={`edc-admin-layout${preferences.density === "compact" ? " edc-admin-layout-compact" : ""}${platformSettings.appearance.theme === "dark" || (platformSettings.appearance.theme === "system" && systemPrefersDark) ? " edc-admin-theme-dark" : ""}${platformSettings.appearance.sidebar === "compact" ? " edc-admin-sidebar-collapsed" : ""}`}>
      <AdminSidebar
        email={email}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        platformSettings={platformSettings}
      />
      <div className="edc-admin-main">
        <AdminTopbar
          sectionTitle={section.pageTitle ?? section.title}
          email={email}
          isMenuOpen={mobileSidebarOpen}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onLogout={handleAdminLogout}
          notifications={notificationData.notifications}
          notificationErrors={notificationData.errors}
        />
        <main className="edc-admin-content">
          {!["dashboard", "users", "courses", "knowledge", "moderation", "finance", "ai-operations", "security", "support", "activity-log", "reports", "settings"].includes(section.id) && <section className="edc-admin-page-heading">
            <div><p>{section.description}</p></div>
          </section>}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
