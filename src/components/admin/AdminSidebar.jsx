import { GraduationCap, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  ADMIN_NAV_GROUPS,
  getAdminSectionByPath,
} from "./adminNavigation";
import { ADMIN_USERS_KEY, readAdminArray } from "./adminData";

function AdminSidebar({ email, isOpen, onClose, platformSettings }) {
  const location = useLocation();
  const currentSection = getAdminSectionByPath(location.pathname);
  const highlightedItemId = currentSection?.parentId ?? currentSection?.id;
  const account = readAdminArray(ADMIN_USERS_KEY).find((user) => user.role === "Admin" && String(user.email).toLowerCase() === String(email || "").toLowerCase());
  const displayName = account?.name?.trim() || "Admin";
  const websiteName = platformSettings?.general?.websiteName || "EduConnect AI";
  const isDefaultWebsiteName = websiteName.trim().toLowerCase() === "educonnect ai";
  const logoUrl = platformSettings?.general?.logoUrl;
  const tagline = platformSettings?.general?.tagline || "Admin Panel";

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
            {logoUrl ? <img src={logoUrl} alt="" /> : <GraduationCap size={22} />}
          </span>
          <span className="edc-admin-brand-copy">
            <strong>{isDefaultWebsiteName ? <>EduConnect <b>AI</b></> : websiteName}</strong>
            <small>{tagline}</small>
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

        <div className="edc-admin-user">
          <div className="edc-admin-user-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</div>
          <div><strong>{displayName}</strong><span>{email || "Admin account"}</span></div>
        </div>

        <span className="edc-admin-menu-label">MANAGEMENT</span>

        <nav
          id="edc-admin-navigation"
          className="edc-admin-navigation"
          aria-label="Admin sections"
        >
          {ADMIN_NAV_GROUPS.map(({ id: groupId, label, items }) => {
            const labelId = `edc-admin-navigation-label-${groupId}`;
            return <div key={groupId} className="edc-admin-nav-group" role="group" aria-labelledby={label ? labelId : undefined}>
              {label && <span id={labelId} className="edc-admin-navigation-label">{label}</span>}
              {items.map(({ id, path, title, navTitle, icon: Icon }) => {
                const isCurrentPage = id === currentSection?.id;
                const isHighlighted = id === highlightedItemId;
                return <Link key={id} to={path} aria-current={isCurrentPage ? "page" : isHighlighted ? "true" : undefined}
                  className={`edc-admin-nav-item${isHighlighted ? " edc-admin-nav-item-active" : ""}`} onClick={onClose}>
                  <Icon size={19} aria-hidden="true" /><span>{navTitle ?? title}</span>
                </Link>;
              })}
            </div>;
          })}
        </nav>

        <div className="edc-admin-sidebar-footer">
          <strong>{websiteName}</strong>
          <p>Admin workspace</p>
          <span><i className="edc-admin-status-dot" aria-hidden="true" /> Admin session active</span>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
