import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BookOpen, FileText, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatAdminNotificationTimestamp } from "./adminNotificationData";
import { ADMIN_DATA_CHANGED_EVENT, ADMIN_USERS_KEY, getAdminCourses, readAdminArray, readAdminSupportRequestsState, readAdminUsersState } from "./adminData";

function readSearchDirectory() {
  const users = readAdminUsersState().users;
  return {
    users,
    courses: getAdminCourses(users),
    requests: readAdminSupportRequestsState().records,
  };
}

function AdminTopbar({
  sectionTitle,
  email,
  isMenuOpen,
  onMenuClick,
  onLogout,
  notifications,
  notificationErrors,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [directory, setDirectory] = useState(readSearchDirectory);
  const recentNotifications = notifications.slice(0, 5);
  const adminAccount = readAdminArray(ADMIN_USERS_KEY).find((user) => user.role === "Admin" && String(user.email || "").toLowerCase() === String(email || "").toLowerCase());
  const adminName = adminAccount?.name?.trim() || "Admin";
  const adminAvatar = adminAccount?.avatar || adminAccount?.profile?.avatar || "";
  const showGlobalSearch = !["Teacher Applications", "Tutor Marketplace"].includes(sectionTitle);
  const query = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return [];
    return [
      ...directory.users
        .filter((user) => `${user.name || ""} ${user.email || ""} ${user.role || ""}`.toLowerCase().includes(query))
        .map((user) => ({ key: `user-${user.email}`, title: user.name || user.email || "Registered user", detail: `${user.role || "Role unavailable"} · ${user.email || "Email unavailable"}`, path: `/admin/users?q=${encodeURIComponent(search.trim())}`, icon: UserRound })),
      ...directory.courses
        .filter((course) => `${course.title || ""} ${course.category || ""} ${course.teacherEmail || ""}`.toLowerCase().includes(query))
        .map((course) => ({ key: `course-${course.teacherEmail}-${course.id}`, title: course.title || "Untitled course", detail: `Course · ${course.teacherEmail || "Teacher unavailable"}`, path: "/admin/courses", icon: BookOpen })),
      ...directory.requests
        .filter((request) => `${request.subject || ""} ${request.requesterName || ""} ${request.requesterEmail || ""} ${request.id || ""}`.toLowerCase().includes(query))
        .map((request) => ({ key: `request-${request.id}`, title: request.subject || "Support request", detail: `Support · ${request.requesterName || request.requesterEmail || "Requester unavailable"}`, path: "/admin/support", icon: FileText })),
    ].slice(0, 7);
  }, [directory, query, search]);

  useEffect(() => {
    const refresh = () => setDirectory(readSearchDirectory());
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    function handlePointerDown(event) {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        notificationButtonRef.current?.focus();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    notificationPanelRef.current?.querySelector("a")?.focus();

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  return (
    <header className={`edc-admin-topbar${["Overview Dashboard", "Users & Permissions", "Course Review & Approval", "AI Knowledge Governance", "Moderation & Governance", "Financial Management", "AI Operations", "Admin Security & Access Control", "Support & Appeals", "Audit Logs", "Reports & Analytics", "Admin Settings"].includes(sectionTitle) ? " edc-admin-topbar-reference-layout" : ""}`}>
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
        <div className="edc-admin-topbar-title">
          <h1>{sectionTitle || "Admin Panel"}</h1>
        </div>
      </div>

      {showGlobalSearch && (
        <div className="edc-admin-global-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            aria-label="Search users, courses, and support tickets"
            aria-expanded={searchFocused && Boolean(query)}
            aria-controls="edc-admin-global-search-results"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearch("");
                setSearchFocused(false);
                event.currentTarget.blur();
              }
            }}
            placeholder="Search users, courses, tickets, or anything..."
          />
          {search && <button type="button" aria-label="Clear search" onMouseDown={(event) => event.preventDefault()} onClick={() => setSearch("")}><X size={15} /></button>}
          {searchFocused && query && <div className="edc-admin-global-search-results" id="edc-admin-global-search-results">
            {searchResults.length ? searchResults.map(({ key, title, detail, path, icon: Icon }) => (
              <Link key={key} to={path} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearch(""); setSearchFocused(false); }}>
                <span><Icon size={15} /></span><div><strong>{title}</strong><small>{detail}</small></div>
              </Link>
            )) : <p>No saved users, courses, or tickets match this search.</p>}
          </div>}
        </div>
      )}

      <div className="edc-admin-account">
        <div className="edc-admin-notification-menu" ref={notificationMenuRef}>
          <button
            ref={notificationButtonRef}
            className="edc-admin-notification-bell"
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="edc-admin-notification-dropdown"
            aria-haspopup="true"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={19} aria-hidden="true" />
            {notifications.length > 0 && (
              <span className="edc-admin-notification-indicator" aria-hidden="true" />
            )}
          </button>
          {notificationsOpen && (
            <section
              className="edc-admin-notification-dropdown"
              id="edc-admin-notification-dropdown"
              aria-label="Recent pending notifications"
              ref={notificationPanelRef}
            >
              <div className="edc-admin-notification-dropdown-heading">
                <strong>Pending notifications</strong>
                <span>Current review items</span>
              </div>
              {notificationErrors.length > 0 && (
                <p className="edc-admin-notification-dropdown-warning" role="status">
                  Some notification sources could not be read.
                </p>
              )}
              {recentNotifications.length > 0 ? (
                <ul className="edc-admin-notification-dropdown-list">
                  {recentNotifications.map((notification) => {
                    const timestamp = formatAdminNotificationTimestamp(
                      notification.timestamp,
                    );
                    return (
                      <li key={notification.id}>
                        <Link
                          to={notification.path}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <span className="edc-admin-notification-dropdown-category">
                            {notification.categoryLabel}
                          </span>
                          <strong>{notification.title}</strong>
                          <span className="edc-admin-notification-dropdown-description">
                            {notification.description}
                          </span>
                          {timestamp && (
                            <time
                              dateTime={new Date(notification.timestamp).toISOString()}
                            >
                              {timestamp}
                            </time>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="edc-admin-notification-dropdown-empty">
                  {notificationErrors.length > 0
                    ? "No notifications are available from the readable sources."
                    : "No pending notifications."}
                </p>
              )}
              <Link
                className="edc-admin-notification-dropdown-all"
                to="/admin/notifications"
                onClick={() => setNotificationsOpen(false)}
              >
                View All Notifications
              </Link>
            </section>
          )}
        </div>
        <div className="edc-admin-topbar-user">
          <span>{adminAvatar ? <img src={adminAvatar} alt="" /> : adminName.charAt(0).toUpperCase()}</span>
          <strong>{adminName}</strong>
        </div>
        <button
          className="edc-admin-logout edc-dashboard-logout"
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
