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
  getAdminOverviewData,
} from "./adminData";

function AdminOverview() {
  const [overview, setOverview] = useState(getAdminOverviewData);

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
              <h3>Recent Activity</h3>
              <p>Recent platform events will appear here.</p>
            </div>
          </div>
          <div className="edc-admin-empty-state">
            <span className="edc-admin-empty-icon" aria-hidden="true">
              <BookOpen size={19} />
            </span>
            <strong>No activity history available</strong>
            <p>
              The current demo does not store activity events. This section
              can show them when the application supports activity history.
            </p>
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
              <p>There are no teacher applications or course approvals awaiting review.</p>
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
                The demo has no separate notification feed or pending items
                to summarize.
              </p>
            </div>
          )}
        </section>
      </div>

      <p className="edc-admin-demo-note">
        Counts use the existing browser demo records. Password data is never
        displayed; activity history and a separate notification feed are not
        currently stored.
      </p>
    </div>
  );
}

export default AdminOverview;
