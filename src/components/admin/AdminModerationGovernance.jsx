import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Eye, FileText, Flag, Search, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { ADMIN_DATA_CHANGED_EVENT, ADMIN_USERS_KEY, readAdminArray, readAdminSupportRequestsState } from "./adminData";
import { applyModerationAction, getModerationPolicies, getModerationReportsState, linkModerationAppeal, MODERATION_REASONS, MODERATION_REPORTS_EVENT, MODERATION_STATUSES, saveModerationPolicies, setModerationPriority } from "../../utils/moderationReports";
import { getBookReviews, getBookRecords } from "../../utils/books";
import { getReviews } from "../../utils/courseReviews";
import { readDiscussions } from "../../utils/courseDiscussions";
import { getModerationVisibilityMap } from "../../utils/moderationVisibility";

const TABS = [
  ["overview", "Overview"], ["all", "All Reports"], ["content", "Reported Content"], ["users", "User Reports"],
  ["reviews", "Reviews & Comments"], ["violations", "Content Violations"],
  ["actions", "Moderation Actions"], ["appeals", "Appeals"], ["policies", "Policies"],
];
const REPORT_TYPES = ["course", "pdf", "video", "review", "book-review", "comment", "teacher", "user"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const VIOLATION_CATEGORIES = ["Copyright Violation", "Spam", "Misleading Content", "Harassment", "Inappropriate Content", "Fake or Fraudulent Content", "Repeated Policy Violations"];
const CATEGORY_FILTERS = [...new Set([...MODERATION_REASONS, ...VIOLATION_CATEGORIES])];

function listForTarget(report) {
  switch (report.targetType) {
    case "pdf": {
      const publishedBook = getBookRecords().find((item) => String(item.id) === report.targetId);
      if (publishedBook) return publishedBook;
      const [email, courseId, ...resourceParts] = report.targetId.split("::");
      if (!email || !courseId || !resourceParts.length) return null;
      try {
        const key = `educonnect.curriculum.v1.${encodeURIComponent(email.toLowerCase())}.${encodeURIComponent(courseId)}`;
        const curriculum = JSON.parse(window.localStorage.getItem(key) || "{}");
        const resourceId = resourceParts.join("::");
        return Array.isArray(curriculum.resources) ? curriculum.resources.find((item) => String(item.id) === resourceId) || null : null;
      } catch { return null; }
    }
    case "review": return getReviews(true).find((item) => String(item.id || `${item.courseKey}:${item.studentEmail}`) === report.targetId);
    case "book-review": return getBookReviews(true).find((item) => String(item.id) === report.targetId);
    case "comment": return readDiscussions().find((item) => String(item.id) === report.targetId);
    case "user":
    case "teacher": return readAdminArray(ADMIN_USERS_KEY).find((item) => String(item.email).toLowerCase() === report.targetId.toLowerCase());
    case "course": {
      const [email, ...idParts] = report.targetId.split("::");
      const courseId = idParts.join("::");
      return readLocalCourse(email, courseId);
    }
    case "video": {
      const [email, courseId, ...lessonParts] = report.targetId.split("::");
      const lessonId = lessonParts.join("::");
      const course = readLocalCourse(email, courseId);
      if (!course) return null;
      const lessons = Array.isArray(course.lessons) ? course.lessons : Array.isArray(course.lessonItems) ? course.lessonItems : [];
      const lesson = lessons.find((item) => String(item.id) === lessonId) || lessons[Number(lessonId)] || null;
      return { courseTitle: course.title, courseId, lessonId, lesson };
    }
    default: return null;
  }
}

function readLocalCourse(email, courseId) {
  try {
    const courses = JSON.parse(window.localStorage.getItem(`educonnect.teacher.${email}.courses`) || "[]");
    return Array.isArray(courses) ? courses.find((item) => String(item.id) === courseId) || null : null;
  } catch { return null; }
}

function fmt(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function safeSnapshot(value) {
  if (Array.isArray(value)) return value.map(safeSnapshot);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/(password|token|secret|credential|session)/i.test(key))
      .map(([key, item]) => [key, safeSnapshot(item)]));
  }
  return value;
}

function isAcceptedAppeal(appeal) {
  const accepted = ["accepted", "appeal accepted", "accepted appeal"];
  return appeal?.appealAccepted === true || [appeal?.status, appeal?.decision, appeal?.outcome, appeal?.resolution].some((value) => accepted.includes(String(value || "").trim().toLowerCase()));
}

function matchesReport(report, tab) {
  if (tab === "content") return report.reportType === "content" && !["review", "book-review", "comment"].includes(report.targetType);
  if (tab === "users") return report.reportType === "user";
  if (tab === "reviews") return ["review", "book-review", "comment"].includes(report.targetType);
  if (tab === "violations") return report.violation?.status === "Confirmed";
  return true;
}

function AdminModerationGovernance({ email }) {
  const [reportState, setReportState] = useState(getModerationReportsState);
  const [supportState, setSupportState] = useState(readAdminSupportRequestsState);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("Mark Under Review");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [violationCategory, setViolationCategory] = useState(VIOLATION_CATEGORIES[0]);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [appealId, setAppealId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [policies, setPolicies] = useState(getModerationPolicies);
  const [editingPolicy, setEditingPolicy] = useState("");
  const [policyMessage, setPolicyMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    setReportState(getModerationReportsState());
    setSupportState(readAdminSupportRequestsState());
    setPolicies(getModerationPolicies());
  };
  useEffect(() => {
    window.addEventListener(MODERATION_REPORTS_EVENT, refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(MODERATION_REPORTS_EVENT, refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const reports = reportState.records;
  const counts = {
    total: reports.length,
    pending: reports.filter((item) => item.status === "Pending").length,
    resolved: reports.filter((item) => item.status === "Resolved").length,
    urgent: reports.filter((item) => item.priority === "Urgent").length,
  };
  const recent = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const typeCounts = reports.reduce((result, item) => ({ ...result, [item.targetType]: (result[item.targetType] || 0) + 1 }), {});
  const statusCounts = reports.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {});
  const filtered = useMemo(() => {
    const query = search.trim().replace(/\s+/g, " ").toLowerCase();
    return reports.filter((report) => {
      if (!matchesReport(report, tab) || (status !== "all" && report.status !== status) || (type !== "all" && report.targetType !== type) || (reasonFilter !== "all" && report.reason !== reasonFilter && report.violation?.category !== reasonFilter) || (priority !== "all" && report.priority !== priority)) return false;
      const created = String(report.createdAt || "").slice(0, 10);
      if (dateFrom && created < dateFrom || dateTo && created > dateTo) return false;
      if (!query) return true;
      const haystack = [report.id, report.targetTitle, report.targetId, report.reporterEmail, report.reporterName, report.targetOwnerEmail, report.targetOwnerName, report.reason, report.description].filter(Boolean).join(" ").trim().replace(/\s+/g, " ").toLowerCase();
      return haystack.includes(query);
    }).sort((a, b) => sort === "oldest" ? new Date(a.createdAt) - new Date(b.createdAt) : sort === "priority" ? PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority) || new Date(b.createdAt) - new Date(a.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
  }, [dateFrom, dateTo, priority, reasonFilter, reports, search, sort, status, tab, type]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 15));
  const pageRows = filtered.slice((page - 1) * 15, page * 15);
  const report = selected ? reports.find((item) => item.id === selected.id) || selected : null;
  const supportAppeals = supportState.records.filter((item) => item.category === "Moderation & Appeal");
  const linkedAppeal = report ? supportAppeals.find((item) => String(item.id) === String(report.appealId) || String(item.moderationReportId || "") === String(report.id)) : null;
  const canReverseDecision = Boolean(linkedAppeal && isAcceptedAppeal(linkedAppeal));
  const recentActions = reports.flatMap((item) => (item.history || []).map((entry) => ({ ...entry, reportId: item.id, targetTitle: item.targetTitle }))).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  function resetFilters() { setSearch(""); setStatus("all"); setType("all"); setReasonFilter("all"); setPriority("all"); setSort("newest"); setDateFrom(""); setDateTo(""); setPage(1); }
  function openReport(item) { setSelected(item); setAction(item.reportType === "user" ? "Issue Warning" : "Mark Under Review"); setReason(""); setResolutionNotes(""); setViolationCategory(VIOLATION_CATEGORIES.includes(item.reason) ? item.reason : VIOLATION_CATEGORIES[0]); setAppealId(item.appealId || supportAppeals.find((appeal) => String(appeal.moderationReportId || "") === String(item.id))?.id || ""); setFeedback(null); }
  function takeAction(event) {
    event.preventDefault();
    if (!report || busy) return;
    if (["Hide Content", "Remove Content", "Restore Content", "Reverse Moderation Decision"].includes(action) && !window.confirm(`${action} for “${report.targetTitle}”? This change will affect the previous moderation decision.`)) return;
    setBusy(true);
    try {
      const next = applyModerationAction(report.id, { action, reason, actor: email || "Admin", severity, violationCategory, resolutionNotes });
      setSelected(next);
      setFeedback({ type: "success", text: `${action} recorded.` });
      setReason("");
    } catch (error) { setFeedback({ type: "error", text: error instanceof Error ? error.message : "Action could not be saved." }); }
    finally { setBusy(false); }
  }
  function changePriority(nextPriority) {
    try { setModerationPriority(report.id, nextPriority, email || "Admin"); setFeedback({ type: "success", text: "Priority updated." }); }
    catch (error) { setFeedback({ type: "error", text: error.message }); }
  }
  function savePolicies() {
    try { setPolicies(saveModerationPolicies(policies, email || "Admin")); setEditingPolicy(""); setPolicyMessage("Policy changes saved and added to the Admin Audit Log."); }
    catch (error) { setPolicyMessage(error instanceof Error ? error.message : "Policy changes could not be saved."); }
  }

  return <section className="edc-moderation">
    <div className="edc-moderation-notice"><ShieldAlert size={17} /><p>Reports are allegations, not confirmed violations. Review evidence and record a reason before taking action. This browser-local demo is not a production security boundary.</p></div>
    {reportState.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{reportState.error}</p>}
    <nav className="edc-moderation-tabs" aria-label="Moderation sections">{TABS.map(([id, label]) => <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setPage(1); }}>{label}</button>)}</nav>

    {tab === "overview" && <>
      <div className="edc-moderation-stats">
        <Stat icon={Flag} label="Total Reports" value={counts.total} />
        <Stat icon={Clock3} label="Pending Reports" value={counts.pending} />
        <Stat icon={CheckCircle2} label="Resolved Cases" value={counts.resolved} />
        <Stat icon={AlertTriangle} label="Urgent Reports" value={counts.urgent} />
      </div>
      <div className="edc-moderation-overview-grid">
        <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Recent Reports</h3><p>Newest submitted reports from browser storage.</p></div><button className="edc-admin-action-button" type="button" onClick={() => { setTab("all"); setPage(1); }}>View All Reports <ArrowRight size={14} /></button></div>
          <ReportTable rows={recent} onOpen={openReport} compact /></section>
        <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Reports by Type</h3><p>Counts are calculated from saved reports.</p></div></div><Breakdown values={typeCounts} /></section>
        <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Reports by Status</h3><p>Live status totals.</p></div></div><Breakdown values={statusCounts} /></section>
        <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Pending Cases</h3><p>Cases requiring Admin review.</p></div></div><ReportTable rows={reports.filter((item) => ["Pending", "Under Review", "Escalated"].includes(item.status)).slice(0, 5)} onOpen={openReport} compact /></section>
        <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Recent Moderation Activity</h3><p>Report submissions and recorded actions.</p></div><Link to="/admin/audit-logs">Audit Logs</Link></div><ActionList rows={recentActions.slice(0, 5)} /></section>
      </div>
    </>}

    {tab !== "overview" && tab !== "actions" && tab !== "appeals" && tab !== "policies" && <>
      <div className="edc-moderation-toolbar">
        <label className="edc-admin-search"><Search size={16} /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search ID, title, user, reporter, or reason" aria-label="Search reports" /></label>
        <select className="edc-admin-select" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Filter report type"><option value="all">All types</option>{REPORT_TYPES.map((item) => <option value={item} key={item}>{labelForType(item)}</option>)}</select>
        <select className="edc-admin-select" value={reasonFilter} onChange={(event) => { setReasonFilter(event.target.value); setPage(1); }} aria-label="Filter violation category"><option value="all">All reasons / categories</option>{CATEGORY_FILTERS.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="edc-admin-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter status"><option value="all">All statuses</option>{MODERATION_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="edc-admin-select" value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }} aria-label="Filter priority"><option value="all">All priorities</option>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="edc-moderation-date">From<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
        <label className="edc-moderation-date">To<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label>
        <select className="edc-admin-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort reports"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Urgent priority first</option></select>
        <button className="edc-admin-action-button" type="button" onClick={resetFilters}>Clear Filters</button>
      </div>
      <ReportTable rows={pageRows} onOpen={openReport} />
      <div className="edc-moderation-pagination"><span>Showing {filtered.length ? (page - 1) * 15 + 1 : 0}–{Math.min(page * 15, filtered.length)} of {filtered.length}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </>}

    {tab === "actions" && <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Moderation Actions</h3><p>Immutable browser-local history of report decisions.</p></div><Link to="/admin/audit-logs">Open existing Audit Logs <ArrowRight size={14} /></Link></div>{recentActions.length ? <ActionList rows={recentActions} /> : <Empty icon={ShieldCheck} title="No moderation actions yet" description="Successful review actions will appear here." />}</section>}

{tab === "appeals" && <section className="edc-admin-panel"><div className="edc-admin-panel-heading"><div><h3>Appeals & Disputes</h3><p>Existing Moderation & Appeal requests stay managed in Support & Appeals.</p></div><Link className="edc-admin-button-primary" to="/admin/support">Open Support & Appeals <ArrowRight size={14} /></Link></div>{supportAppeals.length ? <div className="edc-admin-table-wrap"><table className="edc-admin-applications-table"><thead><tr><th>Appeal ID</th><th>Subject</th><th>Requester</th><th>Status</th><th>Submitted</th><th>Linked case / original decision</th><th>Open</th></tr></thead><tbody>{supportAppeals.map((item) => { const linked = reports.filter((record) => String(record.appealId) === String(item.id) || String(item.moderationReportId || "") === String(record.id)); return <tr key={item.id}><td>{item.id}</td><td>{item.subject}</td><td>{item.requesterEmail}</td><td><StatusBadge status={item.status} /></td><td>{fmt(item.createdAt)}</td><td>{linked.length ? linked.map((record) => { const decision = (record.history || []).filter((entry) => entry.action !== "Report submitted" && entry.action !== "Appeal linked").at(-1); return <div key={record.id}><button className="edc-admin-action-button" type="button" onClick={() => openReport(record)}>{record.id}: {decision?.action || "No decision recorded"}</button></div>; }) : "No linked moderation case"}</td><td><Link to="/admin/support">View Appeal</Link></td></tr>; })}</tbody></table></div> : <Empty icon={FileText} title="No appeal records found" description="Appeals categorized as Moderation & Appeal will appear here. No duplicate appeal workflow was created." />}</section>}

    {tab === "policies" && <section className="edc-moderation-policies">{policyMessage && <p className="edc-admin-feedback edc-admin-feedback-success" role="status">{policyMessage}</p>}{policies.map((policy) => <article className="edc-admin-panel edc-moderation-policy" key={policy.id}><header><div><h3>{policy.title}</h3><small>Version {policy.version} · Updated {fmt(policy.updatedAt)} · {policy.updatedBy || "Default policy"}</small></div>{editingPolicy !== policy.id && <button className="edc-admin-action-button" type="button" onClick={() => { setEditingPolicy(policy.id); setPolicyMessage(""); }}>Edit Policy</button>}</header>{editingPolicy === policy.id ? <textarea maxLength={5000} rows={5} value={policy.body} onChange={(event) => setPolicies((current) => current.map((item) => item.id === policy.id ? { ...item, body: event.target.value } : item))} /> : <p>{policy.body}</p>}{editingPolicy === policy.id && <div><button className="edc-admin-button-primary" type="button" onClick={savePolicies}>Save Policy</button><button className="edc-admin-action-button" type="button" onClick={() => { setPolicies(getModerationPolicies()); setEditingPolicy(""); }}>Cancel</button></div>}</article>)}</section>}

      {report && <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="edc-admin-details-modal edc-moderation-detail" role="dialog" aria-modal="true" aria-labelledby="edc-moderation-detail-title"><header className="edc-admin-details-header"><div><span className="edc-admin-page-eyebrow">{report.id}</span><h3 id="edc-moderation-detail-title">{report.targetTitle}</h3></div><button className="edc-admin-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close report">×</button></header>
      <div className="edc-moderation-detail-grid"><Detail label="Content type" value={labelForType(report.targetType)} /><Detail label="Content ID" value={report.targetId} /><Detail label="Reported by" value={`${report.reporterName} (${report.reporterEmail})`} /><Detail label={report.reportType === "user" ? "Reported user" : "Content owner"} value={`${report.targetOwnerName || "Not provided"} ${report.targetRole ? `· ${report.targetRole}` : ""} ${report.targetOwnerEmail ? `(${report.targetOwnerEmail})` : ""}`} /><Detail label="Report reason" value={report.reason} /><Detail label="Date" value={fmt(report.createdAt)} />{report.violation?.status === "Confirmed" && <><Detail label="Confirmed violation" value={report.violation.category} /><Detail label="Severity" value={report.violation.severity} /></>}<div><span>Priority</span><select value={report.priority} onChange={(event) => changePriority(event.target.value)}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></div><div><span>Status</span><StatusBadge status={report.status} /></div></div>
      <article className="edc-moderation-evidence"><strong>Description</strong><p>{report.description}</p>{report.evidence && <p><strong>Evidence:</strong> {report.evidence}</p>}<strong>Reported content snapshot</strong><pre>{JSON.stringify(safeSnapshot(listForTarget(report) || { id: report.targetId, title: report.targetTitle }), null, 2)}</pre></article>
      {report.reportType === "user" && <p className="edc-moderation-notice"><UsersRound size={16} /> Account status and restrictions remain managed in User Management. <Link to="/admin/users">Open User Management</Link></p>}
      <form className="edc-moderation-action-form" onSubmit={takeAction}><h4>Review decision</h4><div className="edc-admin-settings-fields"><label className="edc-admin-settings-field">Action<select value={action} onChange={(event) => setAction(event.target.value)}>{(report.reportType === "user" ? ["Mark Under Review", "Issue Warning", "Dismiss Report", "Escalate Case", "Resolve Case", ...(canReverseDecision ? ["Reverse Moderation Decision"] : [])] : ["Mark Under Review", "Dismiss Report", "Hide Content", "Remove Content", ...(getModerationVisibilityMap()[`${report.targetType}:${report.targetId}`] ? ["Restore Content"] : []), "Confirm Violation", "Escalate Case", "Resolve Case", ...(canReverseDecision ? ["Reverse Moderation Decision"] : [])]).map((item) => <option key={item}>{item}</option>)}</select></label>{action === "Confirm Violation" && <><label className="edc-admin-settings-field">Violation category<select value={violationCategory} onChange={(event) => setViolationCategory(event.target.value)}>{VIOLATION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="edc-admin-settings-field">Confirmed severity<select value={severity} onChange={(event) => setSeverity(event.target.value)}>{SEVERITIES.map((item) => <option key={item}>{item}</option>)}</select></label></>}</div><label className="edc-admin-settings-field">Action reason<textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the evidence-based decision reason" /></label><label className="edc-admin-settings-field">Resolution notes (optional)<textarea maxLength={1000} rows={2} value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} /></label><button className="edc-admin-button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Record Decision"}</button></form>
      {supportAppeals.length > 0 && <div className="edc-moderation-appeal-link"><label className="edc-admin-settings-field">Related Support & Appeals ID<select value={appealId} onChange={(event) => setAppealId(event.target.value)}><option value="">No linked appeal</option>{supportAppeals.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.subject}</option>)}</select></label><button className="edc-admin-action-button" type="button" onClick={() => { try { linkModerationAppeal(report.id, appealId, email || "Admin"); setFeedback({ type: "success", text: "Appeal linked." }); } catch (error) { setFeedback({ type: "error", text: error.message }); } }}>Link Appeal</button>{appealId && <><span className="edc-moderation-appeal-status">{linkedAppeal ? `Appeal status: ${linkedAppeal.status}` : "Appeal record not found"}</span><Link to="/admin/support">View Appeal</Link></>}</div>}
      <h4>Moderation History</h4><ActionList rows={(report.history || []).map((item) => ({ ...item, reportId: report.id, targetTitle: report.targetTitle }))} />
      {feedback && <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.text}</p>}
    </section></div>}
  </section>;
}

function Stat({ icon: Icon, label, value }) { return <article className="edc-admin-stat-card"><span className="edc-admin-stat-icon"><Icon size={18} /></span><p>{label}</p><strong>{value}</strong></article>; }
function Detail({ label, value }) { return <div><span>{label}</span><strong>{value || "Not provided"}</strong></div>; }
function labelForType(value) { return String(value || "unknown").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function StatusBadge({ status }) { const normalized = String(status || "").toLowerCase(); const className = ["resolved", "accepted"].includes(normalized) ? "edc-admin-status-approved" : ["pending", "submitted"].includes(normalized) ? "edc-admin-status-pending" : ["escalated", "rejected"].includes(normalized) ? "edc-admin-status-rejected" : ["dismissed", "closed"].includes(normalized) ? "edc-admin-status-unknown" : "edc-admin-status-changes"; return <span className={`edc-admin-status-badge ${className}`}>{status}</span>; }
function Empty({ icon: Icon, title, description }) { return <div className="edc-admin-applications-empty"><span className="edc-admin-applications-empty-icon"><Icon size={23} /></span><h3>{title}</h3><p>{description}</p></div>; }
function Breakdown({ values }) { const entries = Object.entries(values); return entries.length ? <dl className="edc-admin-breakdown-list">{entries.map(([key, value]) => <div key={key}><dt>{labelForType(key)}</dt><dd>{value}</dd></div>)}</dl> : <p className="edc-moderation-empty-note">No saved reports yet.</p>; }
function ActionList({ rows }) { return rows.length ? <ul className="edc-moderation-action-list">{rows.map((item, index) => <li key={`${item.reportId}-${item.timestamp}-${index}`}><span><strong>{item.action}</strong><small>{item.reportId} · {item.targetTitle}</small></span><span><b>{item.actor}</b><small>{fmt(item.timestamp)}</small></span></li>)}</ul> : <p className="edc-moderation-empty-note">No moderation activity yet.</p>; }
function ReportTable({ rows, onOpen, compact = false }) { return rows.length ? <div className="edc-admin-table-wrap"><table className="edc-admin-applications-table"><thead><tr><th>Report ID</th><th>{compact ? "Content / User" : "Reported content or user"}</th><th>Type</th><th>Reason</th><th>Priority</th><th>Status</th><th>Date</th><th>Details</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{item.id}</td><td><strong>{item.targetTitle}</strong><small className="edc-moderation-reporter">By {item.reporterEmail}</small></td><td>{labelForType(item.targetType)}</td><td>{item.reason}</td><td>{item.priority}</td><td><StatusBadge status={item.status} /></td><td>{fmt(item.createdAt)}</td><td><button className="edc-admin-action-button" type="button" onClick={() => onOpen(item)}><Eye size={14} /> Open</button></td></tr>)}</tbody></table></div> : <Empty icon={Flag} title="No matching reports" description="Reports submitted through the existing learning experience will appear here. This queue does not generate sample reports." />; }

export default AdminModerationGovernance;
