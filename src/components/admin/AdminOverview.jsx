import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ADMIN_DATA_CHANGED_EVENT,
  getAdminActivityLog,
  getAdminOverviewData,
} from "./adminData";

function AdminOverview() {
  const [overview, setOverview] = useState(getAdminOverviewData);
  const recentActivity = getAdminActivityLog()
    .records.slice()
    .sort((first, second) => {
      const left = new Date(first.timestamp || 0).getTime();
      const right = new Date(second.timestamp || 0).getTime();
      return right - left;
    })
    .slice(0, 4);

  useEffect(() => {
    function refreshOverview() {
      setOverview(getAdminOverviewData());
    }

    window.addEventListener("storage", refreshOverview);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshOverview);

    return () => {
      window.removeEventListener("storage", refreshOverview);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshOverview);
    };
  }, []);

  const stats = [
    { label: "Total Students", value: overview.studentCount, icon: GraduationCap },
    { label: "Total Teachers", value: overview.teacherCount, icon: UsersRound },
    { label: "Total Courses", value: overview.courseCount, icon: BookOpen },
    {
      label: "Pending Teacher Applications",
      value: overview.pendingTeacherCount,
      icon: UsersRound,
    },
    {
      label: "Pending Course Approvals",
      value: overview.pendingCourseCount,
      icon: BookOpen,
    },
    {
      label: "Published Courses",
      value: overview.publishedCourseCount,
      icon: CheckCircle2,
    },
    {
      label: "Pending Knowledge Review",
      value: overview.pendingKnowledgeProposalCount,
      icon: BookOpen,
    },
    {
      label: "Approved for Processing",
      value: overview.approvedKnowledgeProposalCount,
      icon: CheckCircle2,
    },
    {
      label: "Rejected Knowledge Proposals",
      value: overview.rejectedKnowledgeProposalCount,
      icon: BookOpen,
    },
  ];

  const pendingTasks = [
    overview.pendingTeacherCount > 0 && {
      label: "Teacher application",
      count: overview.pendingTeacherCount,
      path: "/admin/teachers",
      action: "Review applications",
    },
    overview.pendingCourseCount > 0 && {
      label: "Course approval",
      count: overview.pendingCourseCount,
      path: "/admin/courses",
      action: "Review courses",
    },
    overview.pendingKnowledgeProposalCount > 0 && {
      label: "knowledge proposal",
      count: overview.pendingKnowledgeProposalCount,
      path: "/admin/knowledge",
      action: "Review AI knowledge",
    },
  ].filter(Boolean);

  return (
    <div className="edc-admin-overview">
      <section className="edc-admin-stat-grid" aria-label="Platform summary">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="edc-admin-stat-card" key={label}>
            <span className="edc-admin-stat-icon" aria-hidden="true">
              <Icon size={19} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <div className="edc-admin-overview-grid">
        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Teacher Applications</h3>
              <p>Current teacher account statuses.</p>
            </div>
          </div>
          <dl className="edc-admin-breakdown-list">
            <div><dt>Total teachers</dt><dd>{overview.teacherCount}</dd></div>
            <div><dt>Pending applications</dt><dd>{overview.pendingTeacherCount}</dd></div>
            <div><dt>Approved teachers</dt><dd>{overview.approvedTeacherCount}</dd></div>
            <div><dt>Rejected applications</dt><dd>{overview.rejectedTeacherCount}</dd></div>
          </dl>
        </section>

        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Course Status</h3>
              <p>Approval and publication statuses are counted separately.</p>
            </div>
          </div>
          <dl className="edc-admin-breakdown-list">
            <div><dt>Total courses</dt><dd>{overview.courseCount}</dd></div>
            <div><dt>Pending approval</dt><dd>{overview.pendingCourseCount}</dd></div>
            <div><dt>Approved</dt><dd>{overview.approvedCourseCount}</dd></div>
            <div><dt>Published</dt><dd>{overview.publishedCourseCount}</dd></div>
            <div><dt>Rejected</dt><dd>{overview.rejectedCourseCount}</dd></div>
          </dl>
        </section>

        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>AI Knowledge Governance</h3>
              <p>Separate proposal decisions; no content is processed or published.</p>
            </div>
          </div>
          <dl className="edc-admin-breakdown-list">
            <div><dt>Total proposals</dt><dd>{overview.knowledgeProposalCount}</dd></div>
            <div><dt>Pending review</dt><dd>{overview.pendingKnowledgeProposalCount}</dd></div>
            <div><dt>Approved for processing</dt><dd>{overview.approvedKnowledgeProposalCount}</dd></div>
            <div><dt>Rejected</dt><dd>{overview.rejectedKnowledgeProposalCount}</dd></div>
          </dl>
        </section>

        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest admin actions recorded by the activity log.</p>
            </div>
          </div>
          {recentActivity.length > 0 ? (
            <ul className="edc-admin-activity-summary-list">
              {recentActivity.map((item) => (
                <li key={item.id || `${item.timestamp}-${item.action}`}>
                  <strong>{item.description || item.action || "Admin activity"}</strong>
                  <span>{item.targetName || item.entityId || "Target not provided"}</span>
                  <small>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "Not provided"}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="edc-admin-empty-state">
              <span className="edc-admin-empty-icon" aria-hidden="true">
                <BookOpen size={19} />
              </span>
              <strong>No activity history available</strong>
              <p>
                Successful admin actions will appear here after they are recorded in the activity log.
              </p>
            </div>
          )}
          <div className="edc-admin-activity-summary-link-wrap">
            <Link to="/admin/activity-log" className="edc-admin-activity-summary-link">
              View all activity
            </Link>
          </div>
        </section>

        <section className="edc-admin-panel">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Pending Tasks</h3>
              <p>Open the existing review tools for records that need attention.</p>
            </div>
          </div>
          {pendingTasks.length > 0 ? (
            <ul className="edc-admin-task-list">
              {pendingTasks.map((task) => (
                <li key={task.path}>
                  <Link to={task.path}>
                    <span className="edc-admin-task-copy">
                      <strong>{task.count}</strong>
                      <span>{task.label}{task.count === 1 ? "" : "s"}</span>
                      <small>{task.action}</small>
                    </span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="edc-admin-empty-state edc-admin-empty-state-compact">
              <span className="edc-admin-empty-icon" aria-hidden="true">
                <CheckCircle2 size={19} />
              </span>
              <strong>No pending tasks</strong>
              <p>
                There are no teacher applications, course approvals, or
                knowledge proposals awaiting review.
              </p>
            </div>
          )}
        </section>

        <section className="edc-admin-panel edc-admin-notifications">
          <div className="edc-admin-panel-heading">
            <div>
              <h3>Admin Notifications</h3>
              <p>Summary based on current pending records.</p>
            </div>
          </div>
          {pendingTasks.length > 0 ? (
            <ul className="edc-admin-notification-list">
              {pendingTasks.map((task) => (
                <li key={task.path}>
                  <span className="edc-admin-notification-dot" aria-hidden="true" />
                  <p>
                    <strong>{task.count}</strong>{" "}
                    {task.label.toLowerCase()}{task.count === 1 ? "" : "s"}{" "}
                    {task.count === 1 ? "needs" : "need"} review.
                  </p>
                  <Link to={task.path} aria-label={task.action}>
                    {task.action}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="edc-admin-empty-state edc-admin-empty-state-compact">
              <strong>No notifications</strong>
              <p>
                There are no teacher applications, course reviews, or
                knowledge proposals currently marked for review.
              </p>
            </div>
          )}
          <div className="edc-admin-activity-summary-link-wrap">
            <Link to="/admin/notifications" className="edc-admin-activity-summary-link">
              View notification queue
            </Link>
          </div>
        </section>
      </div>

      <p className="edc-admin-demo-note">
        Counts use the existing browser demo records. Password data is never
        displayed. Notifications are derived from current pending review
        records; historical Admin actions remain in the Activity Log.
      </p>
    </div>
  );
}

export default AdminOverview;
