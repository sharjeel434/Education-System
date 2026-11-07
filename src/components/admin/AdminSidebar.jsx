import { GraduationCap, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  ADMIN_NAV_GROUPS,
  getAdminSectionByPath,
} from "./adminNavigation";

function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const currentSection = getAdminSectionByPath(location.pathname);
  const highlightedItemId = currentSection?.parentId ?? currentSection?.id;

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
          {ADMIN_NAV_GROUPS.map(({ id: groupId, label, items }) => {
            const labelId = `edc-admin-navigation-label-${groupId}`;

            return (
              <div
                key={groupId}
                className="edc-admin-nav-group"
                role="group"
                aria-labelledby={label ? labelId : undefined}
              >
                {label && (
                  <span
                    id={labelId}
                    className="edc-admin-navigation-label"
                  >
                    {label}
                  </span>
                )}
                {items.map(({ id, path, title, navTitle, icon: Icon }) => {
                  const isCurrentPage = id === currentSection?.id;
                  const isHighlighted = id === highlightedItemId;

                  return (
                    <Link
                      key={id}
                      to={path}
                      aria-current={
                        isCurrentPage
                          ? "page"
                          : isHighlighted
                            ? "true"
                            : undefined
                      }
                      className={`edc-admin-nav-item${isHighlighted ? " edc-admin-nav-item-active" : ""}`}
                      onClick={onClose}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{navTitle ?? title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
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
