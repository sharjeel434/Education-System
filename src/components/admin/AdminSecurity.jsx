import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Database,
  Globe,
  KeyRound,
  Layers,
  LogOut,
  RotateCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  appendAdminActivityRecord,
  getAdminActivityLog,
  notifyAdminDataChanged,
  readAdminArray,
} from "./adminData";
import { ADMIN_SECTIONS } from "./adminNavigation";

function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) {
    return "Unavailable";
  }
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "Unavailable";
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain) return "Unavailable";

  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  if (local.length <= 4) {
    return `${local[0]}***${local.slice(-1)}@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
}

function getAdminDisplayName(email) {
  const users = readAdminArray(ADMIN_USERS_KEY);
  const normalized = String(email || "").trim().toLowerCase();
  const match = users.find(
    (user) =>
      typeof user?.email === "string" &&
      user.email.trim().toLowerCase() === normalized &&
      user.role === "Admin",
  );

  return typeof match?.name === "string" && match.name.trim()
    ? match.name.trim()
    : "Administrator";
}

function getRouteStatus(id) {
  if (id === "institutions") {
    return {
      label: "Placeholder",
      badgeClass: "edc-admin-status-unknown",
    };
  }
  return {
    label: "Client Demo",
    badgeClass: "edc-admin-status-approved",
  };
}

function getStorageDiagnostics() {
  try {
    return {
      sessionEntries: window.sessionStorage.length,
      localEntries: window.localStorage.length,
      error: "",
    };
  } catch {
    return {
      sessionEntries: null,
      localEntries: null,
      error: "Browser storage diagnostics are unavailable in this environment.",
    };
  }
}

function formatActivityTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleString();
}

const SECURITY_DETAIL_PAGES = {
  session: {
    description: "Current login identity, role, and browser session details.",
  },
  role: {
    description: "How student, teacher, and admin roles are separated in this demo.",
  },
  runtime: {
    description: "Where authentication state is stored and which protections require a backend.",
  },
  routes: {
    description: "The Admin routes protected by the current role allowlist.",
  },
};

function AdminSecurity({ email, onLogout, view = "overview" }) {
  const [sessionEmail, setSessionEmail] = useState(() =>
    email || window.sessionStorage.getItem("educonnect.demoEmail") || "",
  );
  const [sessionRole, setSessionRole] = useState(() =>
    window.sessionStorage.getItem("educonnect.demoRole") || "",
  );
  const [rememberedEmail, setRememberedEmail] = useState(() =>
    window.localStorage.getItem("educonnect.rememberedEmail") || "",
  );
  const [storageDiagnostics, setStorageDiagnostics] = useState(getStorageDiagnostics);
  const [securityActivityState, setSecurityActivityState] = useState(getAdminActivityLog);
  const [feedback, setFeedback] = useState(null);

  const refreshState = useCallback(() => {
    setSessionEmail(
      email || window.sessionStorage.getItem("educonnect.demoEmail") || "",
    );
    setSessionRole(
      window.sessionStorage.getItem("educonnect.demoRole") || "",
    );
    setRememberedEmail(
      window.localStorage.getItem("educonnect.rememberedEmail") || "",
    );
    setStorageDiagnostics(getStorageDiagnostics());
    setSecurityActivityState(getAdminActivityLog());
  }, [email]);

  useEffect(() => {
    window.addEventListener("storage", refreshState);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshState);

    return () => {
      window.removeEventListener("storage", refreshState);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshState);
    };
  }, [refreshState]);

  const displayName = getAdminDisplayName(sessionEmail);
  const hasActiveSession = Boolean(sessionRole === "Admin" && sessionEmail);
  const maskedSessionEmail = maskEmail(sessionEmail);
  const maskedRememberedEmail = maskEmail(rememberedEmail);
  const securityActivity = [...securityActivityState.records]
    .filter((record) => record.category === "security")
    .sort((first, second) =>
      new Date(second.timestamp || 0).getTime() -
      new Date(first.timestamp || 0).getTime(),
    )
    .slice(0, 8);
  const routeCounts = ADMIN_SECTIONS.reduce(
    (counts, item) => {
      if (getRouteStatus(item.id).label === "Placeholder") counts.placeholders += 1;
      else counts.clientDemo += 1;
      return counts;
    },
    { clientDemo: 0, placeholders: 0 },
  );

  function handleClearRememberedEmail() {
    setFeedback(null);
    if (!window.localStorage.getItem("educonnect.rememberedEmail")) {
      setFeedback({
        type: "info",
        message: "No remembered login email is currently stored in this browser.",
      });
      return;
    }

    try {
      window.localStorage.removeItem("educonnect.rememberedEmail");
      setRememberedEmail("");

      appendAdminActivityRecord({
        actor: sessionEmail || "Admin",
        action: "Cleared remembered login email",
        category: "security",
        entityType: "Login Preference",
        entityId: "rememberedEmail",
        targetName: "Browser Local Storage",
        description: "Administrator removed the remembered login email preference from this browser. User accounts and passwords were not modified.",
        result: "Success",
      });

      notifyAdminDataChanged();
      setFeedback({
        type: "success",
        message: "Remembered login email was removed from this browser. Your user account and active session remain unchanged.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to remove the remembered login email from browser storage.",
      });
    }
  }

  function handleRecordSecurityReview() {
    setFeedback(null);
    try {
      appendAdminActivityRecord({
        actor: sessionEmail || "Admin",
        action: "Security posture reviewed",
        category: "security",
        entityType: "Security Audit",
        entityId: "security-review",
        targetName: "Admin Security & Access Control",
        description: "Administrator manually logged a security posture checkpoint. No automated vulnerability scans were run.",
        result: "Success",
      });

      notifyAdminDataChanged();
      setFeedback({
        type: "success",
        message: "Manual security review checkpoint has been recorded in the Admin Activity Log.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Could not record security review checkpoint to browser storage.",
      });
    }
  }

  function handleTerminateSession() {
    if (!window.confirm("End your current Admin session and return to the login screen?")) {
      return;
    }

    try {
      appendAdminActivityRecord({
        actor: sessionEmail || "Admin",
        action: "Session terminated",
        category: "security",
        entityType: "Admin Session",
        entityId: sessionEmail || "active-session",
        targetName: "Local Admin Session",
        description: "Administrator explicitly logged out from the Security & Access Control panel.",
        result: "Success",
      });
    } catch {
      // Non-blocking catch to ensure logout proceeds even if log write encounters an issue
    }

    if (typeof onLogout === "function") {
      onLogout();
    } else {
      window.sessionStorage.removeItem("educonnect.demoEmail");
      window.sessionStorage.removeItem("educonnect.demoRole");
      window.location.href = "/login";
    }
  }

  const detailPage = SECURITY_DETAIL_PAGES[view];

  return (
    <div className={`edc-admin-security${detailPage ? ` edc-admin-security-detail edc-admin-security-page-${view}` : ""}`}>
      {detailPage && (
        <div className="edc-admin-security-detail-heading">
          <Link className="edc-admin-export-link" to="/admin/security">
            ← Back to Security overview
          </Link>
          <p>{detailPage.description}</p>
        </div>
      )}
      {/* Overview Stat Cards */}
      <section className="edc-admin-stat-grid" aria-label="Security summary">
        <Link to="/admin/security/session" className="edc-admin-stat-card edc-admin-stat-card-link edc-admin-ops-card edc-admin-ops-card-link">
          <span className="edc-admin-stat-icon" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <p>Session Status</p>
          <strong style={{ fontSize: "19px" }}>
            {hasActiveSession ? "Active Demo Session" : "Inactive"}
          </strong>
        </Link>

        <Link to="/admin/security/role" className="edc-admin-stat-card edc-admin-stat-card-link edc-admin-ops-card edc-admin-ops-card-link">
          <span className="edc-admin-stat-icon" aria-hidden="true">
            <UserCheck size={19} />
          </span>
          <p>Assigned Role</p>
          <strong style={{ fontSize: "20px" }}>
            {sessionRole || "None"}
          </strong>
        </Link>

        <Link to="/admin/security/runtime" className="edc-admin-stat-card edc-admin-stat-card-link edc-admin-ops-card edc-admin-ops-card-link">
          <span className="edc-admin-stat-icon" aria-hidden="true">
            <KeyRound size={19} />
          </span>
          <p>Authentication Runtime</p>
          <strong style={{ fontSize: "18px" }}>
            Client Storage (Demo)
          </strong>
        </Link>

        <Link to="/admin/security/routes" className="edc-admin-stat-card edc-admin-stat-card-link edc-admin-ops-card edc-admin-ops-card-link">
          <span className="edc-admin-stat-icon" aria-hidden="true">
            <Layers size={19} />
          </span>
          <p>Guarded Admin Routes</p>
          <strong>{ADMIN_SECTIONS.length}</strong>
        </Link>
      </section>

      {/* Primary Grid Layout */}
      <div className="edc-admin-overview-grid">
        {/* Section A: Authentication Status */}
        <section className="edc-admin-panel" id="security-authentication">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Authentication Status</h3>
              <p>Current administrative identity and frontend authentication details.</p>
            </div>
          </div>

          <dl className="edc-admin-breakdown-list">
            <div>
              <dt>Account Name</dt>
              <dd><strong>{displayName}</strong></dd>
            </div>
            <div>
              <dt>Account Email (Masked)</dt>
              <dd>
                <code>{maskedSessionEmail}</code>
              </dd>
            </div>
            <div>
              <dt>Assigned Role</dt>
              <dd>
                <span className="edc-admin-status-badge edc-admin-status-approved">
                  {sessionRole || "Admin"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Auth Model</dt>
              <dd>Frontend Demo Session</dd>
            </div>
            <div>
              <dt>Password Security</dt>
              <dd>Client-Side Demo Hash (Salted SHA-256)</dd>
            </div>
          </dl>

          <div className="edc-admin-security-notice">
            <ShieldAlert size={16} aria-hidden="true" />
            <div>
              <strong>Frontend Demo Hashing Notice</strong>
              <p>
                Passwords in this demo are hashed client-side with a 16-byte random salt and SHA-256.
                Fast cryptographic hashes like SHA-256 are not intended for production password storage.
                Production applications require slow, adaptive, salted password algorithms (such as Argon2id or bcrypt)
                executed exclusively on an authenticated backend server.
              </p>
            </div>
          </div>
        </section>

        {/* Section B: Session Information */}
        <section className="edc-admin-panel" id="security-session-information">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Session Information</h3>
              <p>Session storage parameters and browser lifecycle in this demo.</p>
            </div>
          </div>

          <dl className="edc-admin-breakdown-list">
            <div>
              <dt>Storage Type</dt>
              <dd><code>window.sessionStorage</code></dd>
            </div>
            <div>
              <dt>Session Storage Entries</dt>
              <dd>{storageDiagnostics.sessionEntries ?? "Unavailable"} (count only; values hidden)</dd>
            </div>
            <div>
              <dt>Browser Local Storage Entries</dt>
              <dd>{storageDiagnostics.localEntries ?? "Unavailable"} (count only; values hidden)</dd>
            </div>
            <div>
              <dt>Session Scope</dt>
              <dd>Associated with current browser tab</dd>
            </div>
            <div>
              <dt>Remembered Login</dt>
              <dd>
                {rememberedEmail ? (
                  <span className="edc-admin-security-tag-pill active">
                    Stored ({maskedRememberedEmail})
                  </span>
                ) : (
                  <span className="edc-admin-security-tag-pill inactive">
                    Not stored
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Inactivity Timeout</dt>
              <dd>
                <span className="edc-admin-security-tag-pill inactive">
                  None (no auto-timeout)
                </span>
              </dd>
            </div>
            <div>
              <dt>Server Invalidation</dt>
              <dd>
                <span className="edc-admin-security-tag-pill inactive">
                  None (client-only tokens)
                </span>
              </dd>
            </div>
          </dl>
          {storageDiagnostics.error && (
            <p className="edc-admin-feedback edc-admin-feedback-error" role="status">
              {storageDiagnostics.error}
            </p>
          )}

          <p className="edc-admin-security-note">
            Session data is held in browser <code>sessionStorage</code> and bound to this tab session.
            No server-side session invalidation or idle timeout exists, and browser session restoration behavior across restarts is not security-guaranteed.
          </p>
        </section>

        {/* Section C: Access Control Overview */}
        <section className="edc-admin-panel" id="security-route-protection" style={{ gridColumn: "1 / -1" }}>
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Access Control &amp; Route Protection Overview</h3>
              <p>Role isolation and client-side route allowlists enforced by the router.</p>
            </div>
          </div>

          <div className="edc-admin-security-role-grid">
            <article className="edc-admin-security-role-card">
              <div className="edc-admin-security-role-title">
                <Users size={16} aria-hidden="true" />
                <strong>Student Role</strong>
              </div>
              <p>
                Restricted to <code>/student/dashboard</code>. Cannot access Teacher workspaces or Admin management routes in the UI.
              </p>
              <small>Client-side redirect to Student workspace on mismatch.</small>
            </article>

            <article className="edc-admin-security-role-card">
              <div className="edc-admin-security-role-title">
                <Users size={16} aria-hidden="true" />
                <strong>Teacher Role</strong>
              </div>
              <p>
                Restricted to <code>/teacher/dashboard</code>. Can create and submit courses for review; cannot access Admin routes.
              </p>
              <small>Requires admin approval before courses can be published.</small>
            </article>

            <article className="edc-admin-security-role-card edc-admin-security-role-card-highlight">
              <div className="edc-admin-security-role-title">
                <ShieldCheck size={16} aria-hidden="true" />
                <strong>Admin Role (Active)</strong>
              </div>
              <p>
                Granted access to all <code>/admin/*</code> routes. Governs teacher applications, courses, knowledge proposals, and platform data.
              </p>
              <small>Protected by the <code>ADMIN_ROUTES</code> allowlist.</small>
            </article>
          </div>

          <h4 className="edc-admin-security-subtitle">
            Admin Route Allowlist ({ADMIN_SECTIONS.length} routes: {routeCounts.clientDemo} Client Demo, {routeCounts.placeholders} Placeholder)
          </h4>
          <div className="edc-admin-security-route-grid">
            {ADMIN_SECTIONS.map((item) => {
              const status = getRouteStatus(item.id);
              const Icon = item.icon;

              return (
                <div className="edc-admin-security-route-item" key={item.id}>
                  <span className="edc-admin-security-route-icon" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <div className="edc-admin-security-route-meta">
                    <strong>{item.title}</strong>
                    <code>{item.path}</code>
                  </div>
                  <span className={`edc-admin-status-badge ${status.badgeClass}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="edc-admin-security-notice" style={{ marginTop: "16px" }}>
            <AlertTriangle size={16} aria-hidden="true" />
            <div>
              <strong>Client-Side Authorization Boundary</strong>
              <p>
                Route protection is performed in React by <code>DashboardPage.jsx</code> via <code>sessionStorage</code> checks.
                In a production system, every API request must be authorized on a secure backend using server-side session cookies or cryptographic tokens.
              </p>
            </div>
          </div>
        </section>

        <section className="edc-admin-panel" id="security-activity" style={{ gridColumn: "1 / -1" }}>
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Security Activity</h3>
              <p>Recent records from the existing browser-local Admin activity log.</p>
            </div>
            <Link className="edc-admin-export-link" to="/admin/audit-logs">
              Open Audit Logs
            </Link>
          </div>

          {securityActivityState.error && (
            <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
              {securityActivityState.error}
            </p>
          )}
          {!securityActivityState.error && securityActivity.length === 0 && (
            <p className="edc-admin-security-note" role="status">
              No security-category activity records are stored in this browser.
            </p>
          )}
          {!securityActivityState.error && securityActivity.length > 0 && (
            <div className="edc-admin-table-wrap">
              <table className="edc-admin-activity-table">
                <thead>
                  <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Action</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {securityActivity.map((record, index) => (
                    <tr key={record.id || `${record.timestamp}-${index}`}>
                      <td>{formatActivityTimestamp(record.timestamp)}</td>
                      <td>{typeof record.action === "string" ? record.action : "Security activity"}</td>
                      <td>{typeof record.result === "string" ? record.result : "Not recorded"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="edc-admin-applications-count">
            Showing {securityActivity.length} recent security record{securityActivity.length === 1 ? "" : "s"}.
          </p>
        </section>

        {/* Section D: Security & Architecture Limitations */}
        <section className="edc-admin-panel" id="security-limitations" style={{ gridColumn: "1 / -1" }}>
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Honest Security &amp; Architecture Limitations</h3>
              <p>Technical boundaries inherent to the current frontend-only architecture.</p>
            </div>
          </div>

          <div className="edc-admin-security-limitations-grid">
            <div className="edc-admin-security-limitation-item">
              <div className="edc-admin-security-limitation-header">
                <Server size={15} aria-hidden="true" />
                <strong>No Backend Verification</strong>
              </div>
              <p>
                Authentication, role checks, and approval actions run solely in JavaScript. There is no server API, database, or backend validation engine.
              </p>
            </div>

            <div className="edc-admin-security-limitation-item">
              <div className="edc-admin-security-limitation-header">
                <Database size={15} aria-hidden="true" />
                <strong>Plaintext Browser Storage</strong>
              </div>
              <p>
                All account profiles, courses, and settings reside in unencrypted <code>localStorage</code>, which can be inspected or modified in browser DevTools.
              </p>
            </div>

            <div className="edc-admin-security-limitation-item">
              <div className="edc-admin-security-limitation-header">
                <Clock3 size={15} aria-hidden="true" />
                <strong>Mutable Client Audit Log</strong>
              </div>
              <p>
                Administrative actions are saved to <code>educonnect.adminActivityLog</code> locally. They do not constitute a tamper-proof or compliance audit trail.
              </p>
            </div>

            <div className="edc-admin-security-limitation-item">
              <div className="edc-admin-security-limitation-header">
                <Globe size={15} aria-hidden="true" />
                <strong>No Cross-Device Synchronization</strong>
              </div>
              <p>
                Records created or approved in this browser session are not synchronized with other users, browsers, or devices.
              </p>
            </div>
          </div>
        </section>

        {/* Section E: Supported Security Actions */}
        <section className="edc-admin-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Supported Security Actions</h3>
              <p>Administrative actions genuinely supported by the current frontend storage architecture.</p>
            </div>
          </div>

          {feedback && (
            <p
              className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
              style={{ marginTop: "14px" }}
            >
              {feedback.message}
            </p>
          )}

          <div className="edc-admin-security-actions-wrap">
            <div className="edc-admin-security-action-box">
              <div>
                <strong>Terminate Admin Session</strong>
                <p>
                  Logs out of the current demo session, removes sessionStorage tokens, and returns to the login screen.
                  Uses the existing application logout flow.
                </p>
              </div>
              <button
                type="button"
                className="edc-admin-action-button edc-admin-security-danger-btn"
                onClick={handleTerminateSession}
              >
                <LogOut size={15} aria-hidden="true" />
                Terminate Session
              </button>
            </div>

            <div className="edc-admin-security-action-box">
              <div>
                <strong>Clear Remembered Login Email</strong>
                <p>
                  Removes only the <code>educonnect.rememberedEmail</code> preference key from this browser.
                  Does not delete user accounts, passwords, or the current active session.
                </p>
              </div>
              <button
                type="button"
                className="edc-admin-action-button"
                disabled={!rememberedEmail}
                onClick={handleClearRememberedEmail}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Clear Remembered Email
              </button>
            </div>

            <div className="edc-admin-security-action-box">
              <div>
                <strong>Record Security Review Checkpoint</strong>
                <p>
                  Appends a manual checkpoint entry to the Admin Activity Log confirming an administrator reviewed access controls and platform limitations.
                  This is a manual record and does not run automated vulnerability or compliance scans.
                </p>
              </div>
              <button
                type="button"
                className="edc-admin-action-button"
                onClick={handleRecordSecurityReview}
              >
                <ShieldCheck size={15} aria-hidden="true" />
                Record Security Review
              </button>
            </div>
          </div>

          <h4 className="edc-admin-security-subtitle" style={{ marginTop: "24px" }}>
            Unavailable Enterprise Features (Requires Backend Architecture)
          </h4>
          <ul className="edc-admin-security-unavailable-list">
            <li>
              <strong>Two-Factor Authentication (2FA / MFA):</strong> Requires an authentication service supporting TOTP, SMS, or FIDO2/WebAuthn.
            </li>
            <li>
              <strong>Remote Session Revocation:</strong> Requires centralized server-side session stores (e.g., Redis / JWT blocklists) across devices.
            </li>
            <li>
              <strong>IP Allowlisting &amp; Geo-Fencing:</strong> Requires an API gateway or reverse proxy inspecting client network parameters.
            </li>
            <li>
              <strong>Rate Limiting &amp; Brute-Force Throttling:</strong> Requires server-side request throttling and account lockout mechanisms.
            </li>
          </ul>

          <div className="edc-admin-security-footer-links">
            <Link to="/admin/activity-log" className="edc-admin-export-link">
              View Activity Log Records
            </Link>
            <Link to="/admin/settings" className="edc-admin-export-link">
              Admin Interface Settings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminSecurity;
