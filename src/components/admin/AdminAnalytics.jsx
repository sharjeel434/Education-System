
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  getAdminActivityLog,
  getAdminCourses,
  getAdminKnowledgeStorageState,
  readAdminArray,
} from "./adminData";

function uniqueUsers(users) {
  const byEmail = new Map();

  users.forEach((user) => {
    if (!user || typeof user !== "object" || Array.isArray(user)) {
      return;
    }

    const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    if (!email) {
      return;
    }

    if (!byEmail.has(email)) {
      byEmail.set(email, user);
    }
  });

  return [...byEmail.values()];
}

function countMap(values) {
  const map = new Map();

  values.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }

    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    map.set(normalized, (map.get(normalized) || 0) + 1);
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

function AdminAnalytics() {
  const [users, setUsers] = useState(() => uniqueUsers(readAdminArray(ADMIN_USERS_KEY)));

  useEffect(() => {
    function refresh() {
      const nextUsers = uniqueUsers(readAdminArray(ADMIN_USERS_KEY));
      setUsers(nextUsers);
    }

    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const roleDistribution = useMemo(() => countMap(users.map((user) => user.role).filter((role) => typeof role === "string")), [users]);

  const courses = useMemo(() => getAdminCourses(users), [users]);
  const courseStatuses = useMemo(() => countMap(courses.map((course) => course.status).filter((status) => typeof status === "string")), [courses]);

  const knowledgeState = useMemo(() => getAdminKnowledgeStorageState(), []);
  const knowledgeProposals = useMemo(() => knowledgeState.proposals, [knowledgeState]);
  const knowledgeStatuses = useMemo(() => countMap(knowledgeProposals.map((proposal) => proposal.status).filter((status) => typeof status === "string")), [knowledgeProposals]);

  const activityState = useMemo(() => getAdminActivityLog(), []);
  const activityRecords = useMemo(() => activityState.records, [activityState]);
  const activityByResult = useMemo(() => countMap(activityRecords.map((record) => record.result).filter((status) => typeof status === "string")), [activityRecords]);

  const totalUsers = users.length;
  const studentCount = users.filter((user) => user.role === "Student").length;
  const teacherCount = users.filter((user) => user.role === "Teacher").length;
  const adminCount = users.filter((user) => user.role === "Admin").length;

  const totalCourses = courses.length;
  const totalKnowledge = knowledgeProposals.length;
  const totalActivity = activityRecords.length;

  const analyticsCards = [
    { label: "Total users", value: totalUsers, icon: UsersRound },
    { label: "Students", value: studentCount, icon: GraduationCap },
    { label: "Teachers", value: teacherCount, icon: UsersRound },
    { label: "Admins", value: adminCount, icon: BarChart3 },
    { label: "Courses", value: totalCourses, icon: BookOpen },
    { label: "Knowledge proposals", value: totalKnowledge, icon: BrainCircuit },
    { label: "Recorded admin actions", value: totalActivity, icon: Activity },
  ];

  const hasAnyData = totalUsers > 0 || totalCourses > 0 || totalKnowledge > 0 || totalActivity > 0;

  return (
    <section className="edc-admin-analytics">
      <div className="edc-admin-analytics-header">
        <div>
          <span className="edc-admin-page-eyebrow">PLATFORM ANALYTICS</span>
          <h3>Current platform overview</h3>
        </div>
        <Link className="edc-admin-export-link" to="/admin/data-export">
          Export available data
        </Link>
      </div>

      {knowledgeState.error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {knowledgeState.error}
        </p>
      )}
      {activityState.error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {activityState.error}
        </p>
      )}

      {!hasAnyData && (
        <div className="edc-admin-applications-empty edc-admin-analytics-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <BarChart3 size={23} />
          </span>
          <h3>No analytics data available</h3>
          <p>Existing platform records are not available in localStorage yet, so no meaningful analytics can be calculated.</p>
        </div>
      )}

      {hasAnyData && (
        <>
          <div className="edc-admin-stat-grid edc-admin-analytics-grid">
            {analyticsCards.map(({ label, value, icon: Icon }) => (
              <article className="edc-admin-stat-card" key={label}>
                <span className="edc-admin-stat-icon" aria-hidden="true">
                  <Icon size={19} />
                </span>
                <p>{label}</p>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <div className="edc-admin-analytics-panels">
            {roleDistribution.length > 0 && (
              <section className="edc-admin-panel">
                <div className="edc-admin-panel-heading">
                  <div>
                    <h3>User role distribution</h3>
                    <p>Counts are based on the current registered user data in this browser.</p>
                  </div>
                </div>
                <div className="edc-admin-analytics-bars">
                  {roleDistribution.map(([role, count]) => (
                    <div key={role} className="edc-admin-analytics-bar-row">
                      <div className="edc-admin-analytics-bar-labels">
                        <span>{role}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="edc-admin-analytics-bar-track">
                        <div
                          className="edc-admin-analytics-bar-fill"
                          style={{ width: `${(count / totalUsers) * 100}%` }}
                        />
                      </div>
                      <small>{formatPercent((count / (totalUsers || 1)) * 100)}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {courseStatuses.length > 0 && (
              <section className="edc-admin-panel">
                <div className="edc-admin-panel-heading">
                  <div>
                    <h3>Course status distribution</h3>
                    <p>Approval and publication states are tracked separately when actual course records store them.</p>
                  </div>
                </div>
                <div className="edc-admin-analytics-bars">
                  {courseStatuses.map(([status, count]) => (
                    <div key={status} className="edc-admin-analytics-bar-row">
                      <div className="edc-admin-analytics-bar-labels">
                        <span>{status}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="edc-admin-analytics-bar-track">
                        <div
                          className="edc-admin-analytics-bar-fill course-fill"
                          style={{ width: `${(count / totalCourses) * 100}%` }}
                        />
                      </div>
                      <small>{formatPercent((count / (totalCourses || 1)) * 100)}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {knowledgeStatuses.length > 0 && (
              <section className="edc-admin-panel">
                <div className="edc-admin-panel-heading">
                  <div>
                    <h3>Knowledge proposal status distribution</h3>
                    <p>Counts reflect the current AI Governance proposal data only.</p>
                  </div>
                </div>
                <div className="edc-admin-analytics-bars">
                  {knowledgeStatuses.map(([status, count]) => (
                    <div key={status} className="edc-admin-analytics-bar-row">
                      <div className="edc-admin-analytics-bar-labels">
                        <span>{status}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="edc-admin-analytics-bar-track">
                        <div
                          className="edc-admin-analytics-bar-fill knowledge-fill"
                          style={{ width: `${(count / totalKnowledge) * 100}%` }}
                        />
                      </div>
                      <small>{formatPercent((count / (totalKnowledge || 1)) * 100)}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activityByResult.length > 0 && (
              <section className="edc-admin-panel">
                <div className="edc-admin-panel-heading">
                  <div>
                    <h3>Activity result distribution</h3>
                    <p>Successful and failed activity records are counted only when stored in the current activity log.</p>
                  </div>
                </div>
                <div className="edc-admin-analytics-bars">
                  {activityByResult.map(([result, count]) => (
                    <div key={result} className="edc-admin-analytics-bar-row">
                      <div className="edc-admin-analytics-bar-labels">
                        <span>{result}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="edc-admin-analytics-bar-track">
                        <div
                          className="edc-admin-analytics-bar-fill activity-fill"
                          style={{ width: `${(count / totalActivity) * 100}%` }}
                        />
                      </div>
                      <small>{formatPercent((count / (totalActivity || 1)) * 100)}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default AdminAnalytics;
