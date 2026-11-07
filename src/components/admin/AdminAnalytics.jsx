
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Gauge,
  GraduationCap,
  LifeBuoy,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ADMIN_DATA_CHANGED_EVENT,
  getAdminActivityLog,
  getAdminCourses,
  getAdminTeachers,
  getAdminKnowledgeStorageState,
  readAdminSupportRequestsState,
  readAdminUsersState,
} from "./adminData";
import {
  AI_DEMO_RECORDS,
  FINANCIAL_DEMO_RECORDS,
  getAdminDemoTransactions,
  getAdminTutorBookings,
  getAdminTutorProfiles,
  readAdminOperationsSettings,
} from "./adminOperationsData";
import "./AdminOperations.css";

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

function readReportsSnapshot() {
  const userState = readAdminUsersState();
  const users = uniqueUsers(userState.users);
  const teachers = getAdminTeachers(users);
  const courses = getAdminCourses(users);
  const knowledgeState = getAdminKnowledgeStorageState();
  const activityState = getAdminActivityLog();
  const supportState = readAdminSupportRequestsState();
  const operationsSettings = readAdminOperationsSettings();
  const tutorProfiles = getAdminTutorProfiles(operationsSettings, userState.users);
  const tutorBookings = getAdminTutorBookings();
  const transactionState = getAdminDemoTransactions();
  const transactions = transactionState.transactions.length
    ? transactionState.transactions
    : FINANCIAL_DEMO_RECORDS.transactions;

  return {
    users,
    teachers,
    courses,
    knowledgeState,
    activityState,
    supportState,
    operationsSettings,
    tutorProfiles,
    tutorBookings,
    transactionState,
    transactions,
    transactionSource: transactionState.transactions.length
      ? "Browser-local demo orders"
      : "Illustrative sample transactions",
    errors: [
      userState.error,
      knowledgeState.error,
      activityState.error,
      supportState.error,
      operationsSettings.error,
      ...tutorBookings.errors,
      ...transactionState.errors,
    ].filter(Boolean),
  };
}

function DistributionPanel({ title, description, values, total, fillClass = "" }) {
  return (
    <section className="edc-admin-panel">
      <div className="edc-admin-panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {values.length === 0 ? (
        <p className="edc-admin-security-note">No records are available for this report in the current browser.</p>
      ) : (
        <div className="edc-admin-analytics-bars">
          {values.map(([label, count]) => (
            <div key={label} className="edc-admin-analytics-bar-row">
              <div className="edc-admin-analytics-bar-labels">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
              <div className="edc-admin-analytics-bar-track">
                <div
                  className={`edc-admin-analytics-bar-fill ${fillClass}`}
                  style={{ width: `${(count / (total || 1)) * 100}%` }}
                />
              </div>
              <small>{formatPercent((count / (total || 1)) * 100)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminAnalytics() {
  const [reports, setReports] = useState(readReportsSnapshot);

  useEffect(() => {
    function refresh() {
      setReports(readReportsSnapshot());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const {
    users,
    teachers,
    courses,
    knowledgeState,
    activityState,
    supportState,
    tutorProfiles,
    tutorBookings,
    transactionState,
    transactions,
    transactionSource,
    errors,
  } = reports;
  const roleDistribution = useMemo(() => countMap(users.map((user) => user.role).filter((role) => typeof role === "string")), [users]);
  const courseStatuses = useMemo(() => countMap(courses.map((course) => course.status).filter((status) => typeof status === "string")), [courses]);
  const teacherStatuses = useMemo(() => countMap(teachers.map((teacher) => teacher.status).filter((status) => typeof status === "string")), [teachers]);
  const knowledgeProposals = knowledgeState.proposals;
  const knowledgeStatuses = useMemo(() => countMap(knowledgeProposals.map((proposal) => proposal.status).filter((status) => typeof status === "string")), [knowledgeProposals]);
  const supportStatuses = useMemo(() => countMap(supportState.records.map((record) => record.status).filter((status) => typeof status === "string")), [supportState.records]);
  const moderationStatuses = useMemo(
    () => countMap(supportState.records.filter((record) => record.category === "Moderation & Appeal").map((record) => record.status).filter((status) => typeof status === "string")),
    [supportState.records],
  );
  const tutorBookingStatuses = useMemo(
    () => countMap(tutorBookings.records.map((booking) => booking.status).filter((status) => typeof status === "string")),
    [tutorBookings.records],
  );
  const activityRecords = activityState.records;
  const activityByResult = useMemo(() => countMap(activityRecords.map((record) => record.result).filter((status) => typeof status === "string")), [activityRecords]);

  const totalUsers = users.length;
  const studentCount = users.filter((user) => user.role === "Student").length;
  const teacherCount = users.filter((user) => user.role === "Teacher").length;
  const adminCount = users.filter((user) => user.role === "Admin").length;
  const pendingTeacherCount = teachers.filter((teacher) => teacher.status === "pending").length;
  const registeredTutorCount = tutorProfiles.filter((profile) => profile.type === "Registered profile").length;
  const demoTutorCount = tutorProfiles.filter((profile) => profile.type === "Fictional demo profile").length;
  const transactionTotal = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const totalCourses = courses.length;
  const totalKnowledge = knowledgeProposals.length;
  const totalActivity = activityRecords.length;

  const analyticsCards = [
    { label: "Registered users", value: totalUsers, icon: UsersRound, to: "/admin/users" },
    { label: "Students", value: studentCount, icon: GraduationCap, to: "/admin/users" },
    { label: "Teachers", value: teacherCount, icon: ClipboardCheck, to: "/admin/teachers" },
    { label: "Pending teacher applications", value: pendingTeacherCount, icon: ClipboardCheck, to: "/admin/teachers" },
    { label: "Admins", value: adminCount, icon: ShieldCheck, to: "/admin/users" },
    { label: "Course records", value: totalCourses, icon: BookOpen, to: "/admin/courses" },
    { label: "Knowledge proposals", value: totalKnowledge, icon: BrainCircuit, to: "/admin/knowledge" },
    { label: "Support requests", value: supportState.records.length, icon: LifeBuoy, to: "/admin/support" },
    { label: "Moderation & appeal requests", value: supportState.records.filter((record) => record.category === "Moderation & Appeal").length, icon: ShieldCheck, to: "/admin/moderation" },
    { label: "Tutor profiles (incl. demo)", value: tutorProfiles.length, icon: Store, to: "/admin/tutors" },
    { label: "Existing demo bookings", value: tutorBookings.records.length, icon: CalendarDays, to: "/admin/tutors" },
    { label: "Transactions (demo)", value: transactions.length, icon: DollarSign, to: "/admin/finance" },
    { label: "Demo transaction volume", value: `PKR ${transactionTotal.toLocaleString()}`, icon: DollarSign, to: "/admin/finance" },
    { label: "AI sample incidents", value: AI_DEMO_RECORDS.incidents.length, icon: AlertTriangle, to: "/admin/ai-operations" },
    { label: "AI illustrative metrics", value: AI_DEMO_RECORDS.metrics.length, icon: Gauge, to: "/admin/ai-operations" },
    { label: "Recorded admin actions", value: totalActivity, icon: Activity, to: "/admin/audit-logs" },
  ];

  const hasAnyData = totalUsers > 0 || totalCourses > 0 || totalKnowledge > 0 ||
    totalActivity > 0 || supportState.records.length > 0 ||
    tutorBookings.records.length > 0 || transactionState.transactions.length > 0;

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

      <p className="edc-admin-security-note">
        Reports use records available in this browser only, not platform-wide or backend data. Tutor sample profiles, financial sample records, and AI metrics/incidents are illustrative and are labeled as demo information.
      </p>
      {errors.length > 0 && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {errors.join(" ")}
        </p>
      )}

      {!hasAnyData && (
        <div className="edc-admin-applications-empty edc-admin-analytics-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <BarChart3 size={23} />
          </span>
          <h3>No analytics data available</h3>
          <p>No registered users, courses, proposals, support requests, tutor bookings, demo orders, or activity records are available in this browser yet. Illustrative financial and AI sample data is not a platform statistic.</p>
        </div>
      )}

      <div className="edc-admin-stat-grid edc-admin-analytics-grid">
        {analyticsCards.map(({ label, value, icon: Icon, to }) => (
          <Link className="edc-admin-stat-card edc-admin-ops-card edc-admin-ops-card-link" key={label} to={to}>
                <span className="edc-admin-stat-icon" aria-hidden="true">
                  <Icon size={19} />
                </span>
                <p>{label}</p>
                <strong>{value}</strong>
          </Link>
        ))}
      </div>

      {hasAnyData && (
        <div className="edc-admin-analytics-panels">
          <DistributionPanel
            title="Teacher application status"
            description="Current registered teacher account statuses in this browser."
            values={teacherStatuses}
            total={teacherCount}
          />
          <DistributionPanel
            title="Support request status"
            description="Statuses are counted from existing browser-local support records."
            values={supportStatuses}
            total={supportState.records.length}
          />
          <DistributionPanel
            title="Moderation & appeal request status"
            description="A subset of the same Support & Appeals records, selected by their existing category. No second dataset is created."
            values={moderationStatuses}
            total={supportState.records.filter((record) => record.category === "Moderation & Appeal").length}
            fillClass="course-fill"
          />
          <DistributionPanel
            title="Demo booking status"
            description="Statuses are summarized from existing Student browser-local tutor booking records."
            values={tutorBookingStatuses}
            total={tutorBookings.records.length}
          />
          <section className="edc-admin-panel">
            <div className="edc-admin-panel-heading">
              <div>
                <h3>Tutor marketplace summary</h3>
                <p>Existing registered tutor profiles are separated from fictional catalog examples.</p>
              </div>
            </div>
            <dl className="edc-admin-breakdown-list">
              <div><dt>Registered tutor profiles</dt><dd><strong>{registeredTutorCount}</strong></dd></div>
              <div><dt>Fictional demo profiles</dt><dd><strong>{demoTutorCount}</strong></dd></div>
              <div><dt>Browser-local demo bookings</dt><dd><strong>{tutorBookings.records.length}</strong></dd></div>
            </dl>
          </section>
          <section className="edc-admin-panel">
            <div className="edc-admin-panel-heading">
              <div>
                <h3>Financial demo summary</h3>
                <p>{transactionSource}; sample payout, license, adjustment, and invoice records are illustrative only.</p>
              </div>
            </div>
            <dl className="edc-admin-breakdown-list">
              <div><dt>Transaction records</dt><dd><strong>{transactions.length}</strong></dd></div>
              <div><dt>Transaction value (demo)</dt><dd><strong>PKR {transactionTotal.toLocaleString()}</strong></dd></div>
              <div><dt>Sample payouts</dt><dd><strong>{FINANCIAL_DEMO_RECORDS.payouts.length}</strong></dd></div>
              <div><dt>Sample subscriptions / licenses</dt><dd><strong>{FINANCIAL_DEMO_RECORDS.licenses.length}</strong></dd></div>
              <div><dt>Sample refunds / chargebacks</dt><dd><strong>{FINANCIAL_DEMO_RECORDS.adjustments.length}</strong></dd></div>
              <div><dt>Sample invoices</dt><dd><strong>{FINANCIAL_DEMO_RECORDS.invoices.length}</strong></dd></div>
            </dl>
          </section>
          <section className="edc-admin-panel">
            <div className="edc-admin-panel-heading">
              <div>
                <h3>AI Operations demo summary</h3>
                <p>Illustrative records only; no live provider usage, cost, latency, or safety monitoring is connected.</p>
              </div>
            </div>
            <dl className="edc-admin-breakdown-list">
              {AI_DEMO_RECORDS.metrics.map((metric) => (
                <div key={metric.id}><dt>{metric.label} (sample)</dt><dd><strong>{metric.value}</strong></dd></div>
              ))}
              <div><dt>Sample safety incidents</dt><dd><strong>{AI_DEMO_RECORDS.incidents.length}</strong></dd></div>
              <div><dt>Sample evaluations</dt><dd><strong>{AI_DEMO_RECORDS.evaluations.length}</strong></dd></div>
              <div><dt>Example model configurations</dt><dd><strong>{AI_DEMO_RECORDS.models.length}</strong></dd></div>
              <div><dt>Local demo feature flags</dt><dd><strong>{AI_DEMO_RECORDS.flags.length}</strong></dd></div>
            </dl>
          </section>

          <div className="edc-admin-analytics-panels">
            {roleDistribution.length > 0 && (
              <section className="edc-admin-panel">
                <div className="edc-admin-panel-heading">
                  <div>
                    <h3>User role distribution</h3>
                    <p>Counts are based on unique registered account emails in this browser.</p>
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
                    <p>Approval and publication states are tracked from existing teacher course records.</p>
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
                    <p>Counts reflect the current AI Knowledge Governance proposal records only.</p>
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
              <DistributionPanel
                title="Activity result distribution"
                description="Results are counted only from records in the browser-local Admin activity log."
                values={activityByResult}
                total={totalActivity}
                fillClass="activity-fill"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminAnalytics;
