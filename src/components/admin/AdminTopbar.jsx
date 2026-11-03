import { LogOut, Menu } from "lucide-react";
import { ADMIN_USERS_KEY, readAdminArray } from "./adminData";

function getAdminName(email) {
  const adminUser = readAdminArray(ADMIN_USERS_KEY).find(
    (user) => user.role === "Admin" && user.email === email,
  );

  return typeof adminUser?.name === "string" && adminUser.name.trim()
    ? adminUser.name.trim()
    : "Admin";
}

function AdminTopbar({ email, isMenuOpen, onMenuClick, onLogout }) {
  const displayName = getAdminName(email);

  return (
    <header className="edc-admin-topbar">
      <div className="edc-admin-topbar-heading">
        <button
          className="edc-admin-menu-button"
          type="button"
          aria-label="Open admin navigation"
          aria-controls="edc-admin-navigation"
          aria-expanded={isMenuOpen}
          onClick={onMenuClick}
        >
          <Menu size={21} />
        </button>
        <div>
          <span className="edc-admin-topbar-eyebrow">EduConnect AI</span>
          <h1>Admin Panel</h1>
        </div>
      </div>

      <div className="edc-admin-account">
        <span className="edc-admin-account-avatar" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="edc-admin-account-copy">
          <strong>{displayName}</strong>
          <small>{email || "Admin"} · Admin</small>
        </span>
        <button
          className="edc-admin-logout"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={17} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}

export default AdminTopbar;
