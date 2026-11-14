import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Download,
  FileUp,
  GraduationCap,
  Grid2X2,
  List,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ADMIN_ACTIVITY_CATEGORY_LABELS, ADMIN_DATA_CHANGED_EVENT, getAdminActivityLog, readAdminUsersState } from "./adminData";

function exportUsers(users) {
  const rows = [
    ["Name", "Email", "Role", "Status", "Registered"],
    ...users.map((user) => [user.name || "", user.email || "", user.role || "", user.status || "", user.createdAt || user.registeredAt || ""]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "educonnect-users.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value, { includeTime = false } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function displayValue(value) {
  if (typeof value === "string") {
    return value.trim() || "Not available";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "Not available";
}

function userAvatar(user) {
  return user.avatar || user.profile?.avatar || user.studentProfile?.avatar || user.teacherProfile?.avatar || user.tutorProfile?.avatar || "";
}

function roleBadgeClass(role) {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "student") return "edc-admin-role-student";
  if (normalizedRole === "teacher") return "edc-admin-role-teacher";
  if (normalizedRole === "admin") return "edc-admin-role-admin";
  return "edc-admin-status-unknown";
}

function detailValue(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    const values = value.filter(
      (item) => typeof item === "string" || typeof item === "number",
    );
    return values.length ? values.join(", ") : "Not available";
  }
  return displayValue(value);
}

function getUserDetails(user) {
  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["Role", user.role],
    ["Status", user.status],
    ["Registered", user.createdAt || user.registeredAt],
    ["Last updated", user.updatedAt],
  ];
  if (user.id !== undefined && user.id !== null && user.id !== "") {
    fields.unshift(["ID", user.id]);
  }
  const profileFields = [
    ["Institution", "institution"],
    ["Specialization", "specialization"],
    ["Subject", "subject"],
    ["Qualification", "qualification"],
    ["Experience", "experience"],
    ["Availability", "availability"],
    ["Verification status", "verificationStatus"],
    ["Level", "level"],
    ["Rating", "rating"],
    ["Phone", "phone"],
    ["City", "city"],
    ["About", "about"],
    ["Teacher application status", "teacherStatus"],
  ];

  profileFields.forEach(([label, key]) => {
    if (user[key] !== undefined && user[key] !== null && user[key] !== "") {
      fields.push([label, user[key]]);
    }
  });

  [
    ["Profile", user.profile],
    ["Student profile", user.studentProfile],
    ["Teacher profile", user.teacherProfile],
    ["Tutor profile", user.tutorProfile],
    ["Teacher application", user.teacherApplication],
    ["Tutor application", user.tutorApplication],
  ].forEach(([prefix, profile]) => {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return;
    }

    profileFields.forEach(([label, key]) => {
      const value = profile[key];
      if (value !== undefined && value !== null && value !== "") {
        fields.push([`${prefix} ${label.toLowerCase()}`, value]);
      }
    });
  });

  return fields;
}

function filteredRoles(users) {
  const roles = new Set();
  users.forEach((user) => {
    if (typeof user.role === "string" && user.role.trim()) {
      roles.add(user.role.trim());
    }
  });
  return [...roles].sort();
}

function filteredStatuses(users) {
  const statuses = new Set();
  users.forEach((user) => {
    if (typeof user.status === "string" && user.status.trim()) {
      statuses.add(user.status.trim());
    }
  });
  return [...statuses].sort();
}

function AdminUserManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => readAdminUsersState().users);
  const [storeError, setStoreError] = useState(() => readAdminUsersState().error || "");
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [roleFilter, setRoleFilter] = useState(() => new URLSearchParams(location.search).get("role") || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeView, setActiveView] = useState("users");
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [activityRecords, setActivityRecords] = useState(() => getAdminActivityLog().records);

  useEffect(() => {
    function refreshUsers() {
      const state = readAdminUsersState();
      setUsers(state.users);
      setStoreError(state.error || "");
      setActivityRecords(getAdminActivityLog().records);
    }

    window.addEventListener("storage", refreshUsers);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshUsers);

    return () => {
      window.removeEventListener("storage", refreshUsers);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshUsers);
    };
  }, []);

  const roles = useMemo(() => filteredRoles(users), [users]);
  const statuses = useMemo(() => filteredStatuses(users), [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" ||
        String(user.status).toLowerCase() === statusFilter.toLowerCase();
      const searchableText = getUserDetails(user)
        .flatMap(([, value]) => Array.isArray(value) ? value : [value])
        .filter((value) => typeof value === "string" || typeof value === "number")
        .join(" ")
        .toLowerCase();

      return matchesRole && matchesStatus && (!query || searchableText.includes(query));
    });
  }, [roleFilter, search, statusFilter, users]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((Math.min(page, pageCount) - 1) * pageSize, Math.min(page, pageCount) * pageSize);
  const visibleStart = filteredUsers.length ? (Math.min(page, pageCount) - 1) * pageSize + 1 : 0;
  const visibleEnd = Math.min(Math.min(page, pageCount) * pageSize, filteredUsers.length);
  const roleCounts = users.reduce((counts, user) => {
    const role = typeof user.role === "string" && user.role.trim() ? user.role.trim() : "Unspecified";
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
  const userActivity = activityRecords
    .filter((record) => ["user-management", "user-activity"].includes(record.category))
    .sort((first, second) => new Date(second.timestamp || 0) - new Date(first.timestamp || 0))
    .slice(0, 20);

  const detailFields = selectedUser
    ? getUserDetails(selectedUser)
    : [];
  const summaryCards = [
    { label: "Total Users", value: users.length, role: "all", status: "all", icon: UsersRound, color: "purple" },
    { label: "Students", value: users.filter((user) => user.role === "Student").length, role: "Student", status: "all", icon: GraduationCap, color: "orange" },
    { label: "Teachers", value: users.filter((user) => user.role === "Teacher").length, role: "Teacher", status: "all", icon: UserRound, color: "green" },
    { label: "Admins", value: users.filter((user) => user.role === "Admin").length, role: "Admin", status: "all", icon: ShieldCheck, color: "red" },
    { label: "Blocked", value: users.filter((user) => String(user.status).toLowerCase() === "blocked").length, role: "all", status: "blocked", icon: AlertTriangle, color: "violet" },
    { label: "Active Users", value: users.filter((user) => String(user.status).toLowerCase() === "active").length, role: "all", status: "active", icon: UserRound, color: "purple" },
  ];

  return (
    <section className="edc-admin-user-management">
      <div className="edc-admin-user-heading-actions">
        <div><span className="edc-admin-page-eyebrow">ACCOUNT DIRECTORY</span><h2><UsersRound size={23} aria-hidden="true" />Users &amp; Permissions</h2><p>Manage registered accounts, saved roles, and available access controls.</p></div>
        <div>
          <Link className="edc-admin-action-button" to="/admin/data-import"><FileUp size={15} />Import Users</Link>
          <button className="edc-admin-action-button" type="button" onClick={() => exportUsers(users)} disabled={!users.length}><Download size={15} />Export Users</button>
          <button className="edc-admin-button-primary" type="button" onClick={() => navigate("/signup")}><UserRound size={15} />Add User</button>
        </div>
      </div>
      {!storeError && users.length > 0 && (
        <div className="edc-admin-stat-grid" aria-label="User account summaries">
          {summaryCards.map(({ label, value, role, status, icon: Icon, color }) => {
            const isActive = !search && roleFilter === role &&
              (statusFilter === status ||
                (status !== "all" &&
                  String(statusFilter).toLowerCase() === status.toLowerCase()));
            return (
              <button
                type="button"
                className={`edc-admin-stat-card edc-admin-ops-card edc-admin-metric-card edc-admin-metric-${color}${isActive ? " edc-admin-ops-card-active is-active" : ""}`}
                key={label}
                onClick={() => {
                  setSearch("");
                  setRoleFilter(role);
                  setStatusFilter(status);
                  setPage(1);
                }}
                aria-pressed={isActive}
              >
                <span className="edc-admin-stat-icon" aria-hidden="true"><Icon size={19} /></span>
                <p>{label}</p>
                <strong>{value}</strong>
              </button>
            );
          })}
        </div>
      )}
      <nav className="edc-admin-user-tabs" aria-label="User management sections">
        {[
          ["users", "All Users", UsersRound],
          ["roles", "Roles & Permissions", ShieldCheck],
          ["access", "Access Control", ShieldCheck],
          ["activity", "User Activity", Search],
        ].map(([view, label, Icon]) => <button key={view} type="button" aria-current={activeView === view ? "page" : undefined} onClick={() => setActiveView(view)}><Icon size={15} />{label}</button>)}
      </nav>
      {activeView === "users" && <>
      <div className="edc-admin-users-workspace">
      <div className="edc-admin-users-directory">
      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search edc-admin-user-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search registered users</span>
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by name, email or ID"
          />
        </label>

        <div className="edc-admin-application-filters" aria-label="Filter users by role and status">
          {roles.length > 0 && (
            <select
              className="edc-admin-select"
              value={roleFilter}
              onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}
              aria-label="Filter users by role"
            >
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          )}

          {statuses.length > 0 && (
            <select
              className="edc-admin-select"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
              aria-label="Filter users by status"
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
          <div className="edc-admin-user-view-toggle" aria-label="User display">
            <button type="button" aria-pressed={viewMode === "list"} aria-label="List view" onClick={() => setViewMode("list")}><List size={15} /></button>
            <button type="button" aria-pressed={viewMode === "grid"} aria-label="Grid view" onClick={() => setViewMode("grid")}><Grid2X2 size={15} /></button>
          </div>
        </div>
      </div>

      {storeError && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {storeError} Existing saved user records were kept unchanged.
        </p>
      )}

      {!storeError && users.length === 0 && (
        <div className="edc-admin-applications-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <UsersRound size={23} />
          </span>
          <h3>No registered users found</h3>
          <p>No account records are available in this browser yet.</p>
        </div>
      )}

      {!storeError && users.length > 0 && filteredUsers.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-applications-empty-compact">
          <Search size={21} aria-hidden="true" />
          <h3>No matching users</h3>
          <p>Try a different name, email, role, or status filter.</p>
        </div>
      )}

      {!storeError && filteredUsers.length > 0 && (
        viewMode === "list" ? <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table edc-admin-user-table">
            <thead>
              <tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Email</th><th scope="col">Joined</th><th scope="col">Status</th><th scope="col">Actions</th></tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={`${user.email || user.name || "user"}-${user.role || "role"}`}>
                  <td><span className="edc-admin-user-identity"><span className="edc-admin-user-row-avatar">{userAvatar(user) ? <img src={userAvatar(user)} alt="" /> : String(user.name || "?").trim().charAt(0).toUpperCase()}</span><span><strong>{displayValue(user.name)}</strong>{user.id && <small>ID: {displayValue(user.id)}</small>}</span></span></td>
                  <td><span className={`edc-admin-status-badge ${roleBadgeClass(user.role)}`}>{displayValue(user.role)}</span></td>
                  <td>{displayValue(user.email)}</td>
                  <td>{formatDate(user.createdAt || user.registeredAt)}</td>
                  <td><span className={`edc-admin-status-badge ${
                    String(user.status).toLowerCase() === "active" || String(user.status).toLowerCase() === "approved" ? "edc-admin-status-approved" :
                    String(user.status).toLowerCase() === "pending" ? "edc-admin-status-pending" :
                    ["rejected", "blocked"].includes(String(user.status).toLowerCase()) ? "edc-admin-status-rejected" :
                    "edc-admin-status-unknown"
                  }`}>{displayValue(user.status)}</span></td>
                  <td><button className="edc-admin-action-button" type="button" onClick={() => setSelectedUser(user)}><UserRound size={15} aria-hidden="true" />View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : <div className="edc-admin-user-card-grid">
          {visibleUsers.map((user) => <article key={`${user.email || user.name || "user"}-${user.role || "role"}`}>
            <span className="edc-admin-user-card-avatar">{userAvatar(user) ? <img src={userAvatar(user)} alt="" /> : String(user.name || "?").trim().charAt(0).toUpperCase()}</span>
            <div><h3>{displayValue(user.name)}</h3><p>{displayValue(user.email)}</p></div>
            <span className={`edc-admin-status-badge ${roleBadgeClass(user.role)}`}>{displayValue(user.role)}</span>
            <span className="edc-admin-status-badge">{displayValue(user.status)}</span>
            <button className="edc-admin-action-button" type="button" onClick={() => setSelectedUser(user)}><UserRound size={15} />View details</button>
          </article>)}
        </div>
      )}

      <div className="edc-admin-user-pagination">
        <p className="edc-admin-applications-count" aria-live="polite">
          Showing {visibleStart}–{visibleEnd} of {filteredUsers.length} matching users ({users.length} total)
        </p>
        <div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft size={15} /></button><span>Page {Math.min(page, pageCount)} of {pageCount}</span><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}><ArrowRight size={15} /></button></div>
      </div>
      </div>
      <aside className="edc-admin-users-sidebar">
        <section>
          <div className="edc-admin-panel-heading"><div><h3>Role Management</h3><p>Browse registered accounts by saved role.</p></div></div>
          <div className="edc-admin-role-list">{Object.entries(roleCounts).sort((first, second) => second[1] - first[1]).map(([role, count]) => (
            <button key={role} type="button" onClick={() => { setRoleFilter(role); setStatusFilter("all"); setSearch(""); setPage(1); }}>
              <ShieldCheck size={17} /><span><strong>{role}</strong><small>{count.toLocaleString()} registered {count === 1 ? "account" : "accounts"}</small></span><strong className="edc-admin-role-count">{count.toLocaleString()}</strong>
            </button>
          ))}</div>
        </section>
        <section>
          <div className="edc-admin-panel-heading"><div><h3>Permission Settings</h3><p>Current browser-demo access details.</p></div></div>
          <p>Per-user permission changes are not stored in the account model. Admin route and session details are available in Access Control.</p>
          <Link className="edc-admin-action-button" to="/admin/security"><ShieldCheck size={15} />Open Access Control</Link>
        </section>
      </aside>
      </div>
      </>}

      {activeView === "roles" && <div className="edc-admin-user-secondary-grid">
        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading"><div><h3>Role Management</h3><p>Role counts are based on current registered accounts.</p></div></div>
          <div className="edc-admin-role-list">{Object.entries(roleCounts).sort((first, second) => second[1] - first[1]).map(([role, count]) => (
            <button key={role} type="button" onClick={() => { setRoleFilter(role); setStatusFilter("all"); setSearch(""); setPage(1); setActiveView("users"); }}>
              <ShieldCheck size={17} /><span><strong>{role}</strong><small>{count.toLocaleString()} registered {count === 1 ? "account" : "accounts"}</small></span><ArrowRight size={15} />
            </button>
          ))}</div>
        </section>
        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading"><div><h3>Permission Settings</h3><p>Account role editing is not configured in this browser demo.</p></div></div>
          <p className="edc-admin-security-note">Registered role labels are displayed as saved. This page does not create permissions or change a user's role.</p>
          <Link className="edc-admin-action-button" to="/admin/security"><ShieldCheck size={15} />Review Admin Access Control</Link>
        </section>
      </div>}

      {activeView === "access" && <section className="edc-admin-panel edc-admin-user-access-panel">
        <div className="edc-admin-panel-heading"><div><h3>Access Control</h3><p>Review the real browser-session and route access configuration.</p></div></div>
        <p className="edc-admin-security-note">Per-user permission changes are not persisted by the current account model. Open Admin Security for the available route guard and session information.</p>
        <Link className="edc-admin-action-button" to="/admin/security"><ShieldCheck size={15} />Open Admin Security</Link>
      </section>}

      {activeView === "activity" && <section className="edc-admin-panel edc-admin-user-activity-panel">
        <div className="edc-admin-panel-heading"><div><h3>User Activity</h3><p>Only user-management actions actually recorded in the Admin activity log are shown.</p></div><Link to="/admin/audit-logs">Full audit log</Link></div>
        {userActivity.length ? <ul className="edc-admin-activity-summary-list">{userActivity.map((item) => <li key={item.id || `${item.timestamp}-${item.action}`}><strong>{item.description || item.action || "Account activity"}</strong><span>{item.targetName || item.entityId || "Target not provided"}</span><small>{formatDate(item.timestamp, { includeTime: true })} · {ADMIN_ACTIVITY_CATEGORY_LABELS[item.category] || item.category || "Activity"}</small></li>)}</ul> : <div className="edc-admin-applications-empty edc-admin-applications-empty-compact"><h3>No user activity recorded</h3><p>User-management actions will appear here when the Admin activity log contains them.</p></div>}
      </section>}

      {selectedUser && (
        <div className="edc-admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
          <div className="edc-admin-details-modal edc-admin-user-modal">
            <div className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">USER PROFILE</span>
                <h3 id="user-details-title">{displayValue(selectedUser.name)}</h3>
              </div>
              <button
                type="button"
                className="edc-admin-modal-close"
                aria-label="Close user details"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <dl className="edc-admin-details-list">
              {detailFields.map(([label, value], index) => {
                const safeValue = detailValue(value);
                const formattedValue = label === "Registered" || label === "Last updated"
                  ? formatDate(value)
                  : safeValue;

                return (
                  <div className="edc-admin-detail-field" key={`${label}-${index}`}>
                    <dt>{label}</dt>
                    <dd>{formattedValue}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="edc-admin-security-note">
              Only available account and profile fields are shown. Passwords, hashes, salts, and other authentication credentials are not displayed.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminUserManagement;
