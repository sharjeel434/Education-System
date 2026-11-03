import { GraduationCap, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ADMIN_SECTIONS } from "./adminNavigation";

function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          className="edc-admin-backdrop"
          type="button"
          aria-label="Close admin navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`edc-admin-sidebar${isOpen ? " edc-admin-sidebar-open" : ""}`}
        aria-label="Admin panel"
      >
        <div className="edc-admin-brand">
          <span className="edc-admin-brand-icon" aria-hidden="true">
            <GraduationCap size={22} />
          </span>
          <span className="edc-admin-brand-copy">
            <strong>EduConnect <b>AI</b></strong>
            <small>Admin Panel</small>
          </span>
          <button
            className="edc-admin-sidebar-close"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <nav
          id="edc-admin-navigation"
          className="edc-admin-navigation"
          aria-label="Admin sections"
        >
          <span className="edc-admin-navigation-label">WORKSPACE</span>
          {ADMIN_SECTIONS.map(({ id, path, title, icon: Icon }) => (
            <NavLink
              key={id}
              to={path}
              end
              className={({ isActive }) =>
                `edc-admin-nav-item${isActive ? " edc-admin-nav-item-active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="edc-admin-sidebar-footer">
          <span className="edc-admin-status-dot" aria-hidden="true" />
          Frontend demo environment
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
