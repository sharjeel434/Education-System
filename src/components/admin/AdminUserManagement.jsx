import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  GraduationCap,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ADMIN_DATA_CHANGED_EVENT, readAdminUsersState } from "./adminData";
import "./AdminOperations.css";

function formatDate(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
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
  const [users, setUsers] = useState(() => readAdminUsersState().users);
  const [storeError, setStoreError] = useState(() => readAdminUsersState().error || "");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    function refreshUsers() {
      const state = readAdminUsersState();
      setUsers(state.users);
      setStoreError(state.error || "");
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

  const detailFields = selectedUser
    ? getUserDetails(selectedUser)
    : [];
  const summaryCards = [
    { label: "Registered accounts", value: users.length, role: "all", status: "all", icon: UsersRound },
    { label: "Students", value: users.filter((user) => user.role === "Student").length, role: "Student", status: "all", icon: GraduationCap },
    { label: "Teachers", value: users.filter((user) => user.role === "Teacher").length, role: "Teacher", status: "all", icon: UserRound },
    { label: "Admins", value: users.filter((user) => user.role === "Admin").length, role: "Admin", status: "all", icon: ShieldCheck },
    { label: "Active accounts", value: users.filter((user) => String(user.status).toLowerCase() === "active").length, role: "all", status: "active", icon: UserRound },
    { label: "Pending accounts", value: users.filter((user) => String(user.status).toLowerCase() === "pending").length, role: "all", status: "pending", icon: AlertTriangle },
  ];

  return (
    <section className="edc-admin-user-management">
      <p className="edc-admin-security-note">
        These counts and account details come from registered user records stored in this browser. This view is read-only; it does not edit account roles or statuses.
      </p>
      {!storeError && users.length > 0 && (
        <div className="edc-admin-stat-grid" aria-label="User account summaries">
          {summaryCards.map(({ label, value, role, status, icon: Icon }) => {
            const isActive = !search && roleFilter === role &&
              (statusFilter === status ||
                (status !== "all" &&
                  String(statusFilter).toLowerCase() === status.toLowerCase()));
            return (
              <button
                type="button"
                className={`edc-admin-stat-card edc-admin-ops-card${isActive ? " edc-admin-ops-card-active" : ""}`}
                key={label}
                onClick={() => {
                  setSearch("");
                  setRoleFilter(role);
                  setStatusFilter(status);
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
      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search edc-admin-user-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search registered users</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
          />
        </label>

        <div className="edc-admin-application-filters" aria-label="Filter users by role and status">
          {roles.length > 0 && (
            <select
              className="edc-admin-select"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
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
              onChange={(event) => setStatusFilter(event.target.value)}
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
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table edc-admin-user-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Registered</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={`${user.email || user.name || "user"}-${user.role || "role"}`}>
                  <td>
                    <strong>{displayValue(user.name)}</strong>
                  </td>
                  <td>{displayValue(user.email)}</td>
                  <td>
                    <span className="edc-admin-status-badge edc-admin-status-unknown">
                      {displayValue(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`edc-admin-status-badge ${
                      user.status === "active" ? "edc-admin-status-approved" :
                      user.status === "pending" ? "edc-admin-status-pending" :
                      user.status === "rejected" ? "edc-admin-status-rejected" :
                      user.status === "approved" ? "edc-admin-status-approved" :
                      "edc-admin-status-unknown"
                    }`}>
                      {displayValue(user.status)}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt || user.registeredAt)}</td>
                  <td>
                    <button
                      className="edc-admin-action-button"
                      type="button"
                      onClick={() => setSelectedUser(user)}
                    >
                      <UserRound size={15} aria-hidden="true" />
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="edc-admin-applications-count" aria-live="polite">
        Showing {filteredUsers.length} of {users.length} registered user
        {users.length === 1 ? "" : "s"}
      </p>

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
