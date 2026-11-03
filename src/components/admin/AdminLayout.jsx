import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminDashboard from "../../pages/dashboards/AdminDashboard";
import AdminModulePlaceholder from "./AdminModulePlaceholder";
import AdminOverview from "./AdminOverview";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { ADMIN_SECTIONS } from "./adminNavigation";
import "./Admin.css";

const EXISTING_ADMIN_SECTIONS = new Set([
  "teachers",
  "courses",
  "users",
  "reports",
]);

function AdminLayout({ email, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const section =
    ADMIN_SECTIONS.find((item) => item.path === location.pathname) ??
    ADMIN_SECTIONS[0];

  function renderContent() {
    if (section.id === "dashboard") {
      return <AdminOverview />;
    }

    if (EXISTING_ADMIN_SECTIONS.has(section.id)) {
      const initialTab =
        section.id === "teachers"
          ? "teachers"
          : section.id === "courses"
            ? "approvals"
            : section.id;

      return (
        <AdminDashboard
          key={section.id}
          initialTab={initialTab}
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
    <div className="edc-admin-layout">
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
        />
        <main className="edc-admin-content">
          <section className="edc-admin-page-heading">
            <div>
              <span className="edc-admin-page-eyebrow">ADMIN WORKSPACE</span>
              <h2>{section.title}</h2>
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
