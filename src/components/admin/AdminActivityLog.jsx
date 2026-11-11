import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  ADMIN_ACTIVITY_CATEGORY_LABELS,
  ADMIN_DATA_CHANGED_EVENT,
  appendAdminActivityRecord,
  getAdminActivityLog,
} from "./adminData";
import { createCsvContent, downloadCsv } from "./adminCsvUtils";

const PAGE_SIZE = 15;
const ALL_FILTERS = {
  from: "",
  to: "",
  module: "all",
  action: "all",
  role: "all",
  status: "all",
};

const MODULE_LABELS = {
  "teacher-applications": "Teacher Applications",
  "course-review": "Course Review",
  "book-approvals": "Course & Books",
  "user-management": "User Management",
  "user-activity": "User Management",
  security: "Security & Access",
  "financial-management": "Financial Management",
  "admin-settings": "Settings & Configuration",
  "data-export": "Data Export",
  "ai-knowledge": "AI Knowledge Governance",
  "data-import": "Data Import",
  "ai-operations": "AI Operations",
  support: "Support & Moderation",
  moderation: "Moderation & Governance",
  "tutor-marketplace": "Tutor Marketplace",
};

function formatTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function localDateKey(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecordModule(record) {
  if (typeof record?.module === "string" && record.module.trim()) {
    return record.module.trim();
  }
  const category = String(record?.category || "");
  return MODULE_LABELS[category] || ADMIN_ACTIVITY_CATEGORY_LABELS[category] || category || "General";
}

function getRecordAction(record) {
  const action = String(record?.action || "Unknown action").replaceAll("_", " ").trim();
  const normalized = action.toLowerCase();
  if (record?.category === "teacher-applications" && ["approved", "rejected"].includes(normalized)) {
    return `Teacher application ${normalized}`;
  }
  if (record?.category === "course-review" && ["approved", "rejected", "suspended"].includes(normalized)) {
    return `Course ${normalized}`;
  }
  if (record?.category === "book-approvals" && ["approved", "rejected", "published", "unpublished"].includes(normalized)) {
    return `Book ${normalized}`;
  }
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function getRecordRole(record) {
  const role = record?.actorRole || record?.userRole || "Admin";
  return typeof role === "string" && role.trim() ? role.trim() : "Admin";
}

function getRecordStatus(record) {
  const status = record?.status ?? record?.result;
  return typeof status === "string" && status.trim() ? status.trim() : "Unknown";
}

function safeDisplayValue(value, fieldName = "") {
  if (/password|otp|token|api.?key|secret|credential|cvv|card.?number/i.test(fieldName)) {
    return "Hidden for security";
  }
  if (typeof value === "string") {
    return value
      .replace(/(password|otp|token|api.?key|secret|credential|cvv)\s*[:=]\s*[^,;\s]+/gi, "$1: [hidden]")
      .slice(0, 1200);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")
      .map((item) => String(item).slice(0, 160))
      .join(", ")
      .slice(0, 1200);
  }
  return "";
}

function recordDetails(record) {
  const relatedId = record.targetId ?? record.entityId;
  const fields = [
    ["Log ID", record.id],
    ["Action Name", getRecordAction(record)],
    ["Performed By", record.actor],
    ["Actor ID", record.actorId],
    ["User Role", getRecordRole(record)],
    ["Date & Time", formatTimestamp(record.timestamp)],
    ["Module", getRecordModule(record)],
    ["Related Record ID", relatedId],
    ["Previous Value", record.previousValue],
    ["New Value", record.newValue],
    ["Action Status", getRecordStatus(record)],
    ["Reason", record.reason],
    ["Description", record.description],
  ];

  return fields
    .map(([label, value]) => [label, safeDisplayValue(value, label)])
    .filter(([, value]) => value !== "");
}

function AdminActivityLog() {
  const [activityState, setActivityState] = useState(getAdminActivityLog);
  const records = activityState.records;
  const error = activityState.error || "";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterDraft, setFilterDraft] = useState(ALL_FILTERS);
  const [filters, setFilters] = useState(ALL_FILTERS);
  const [overviewFilter, setOverviewFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    function refreshRecords() {
      setActivityState(getAdminActivityLog());
    }

    window.addEventListener("storage", refreshRecords);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRecords);
    return () => {
      window.removeEventListener("storage", refreshRecords);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRecords);
    };
  }, []);

  const options = useMemo(() => {
    const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      modules: unique(records.map(getRecordModule)),
      actions: unique(records.map(getRecordAction)),
      roles: unique(records.map(getRecordRole)),
      statuses: unique(records.map(getRecordStatus)),
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    const recentCutoff = now - 24 * 60 * 60 * 1000;
    return [...records]
      .sort((first, second) => new Date(second.timestamp || 0).getTime() - new Date(first.timestamp || 0).getTime())
      .filter((record) => {
        const module = getRecordModule(record);
        const action = getRecordAction(record);
        const role = getRecordRole(record);
        const status = getRecordStatus(record);
        const date = localDateKey(record.timestamp);
        if (overviewFilter === "admins" && role.toLowerCase() !== "admin") return false;
        if (overviewFilter === "security" && !module.toLowerCase().includes("security")) return false;
        if (overviewFilter === "recent") {
          const timestamp = new Date(record.timestamp || 0).getTime();
          if (timestamp < recentCutoff || timestamp > now) return false;
        }
        if (filters.module !== "all" && module !== filters.module) return false;
        if (filters.action !== "all" && action !== filters.action) return false;
        if (filters.role !== "all" && role !== filters.role) return false;
        if (filters.status !== "all" && status !== filters.status) return false;
        if (filters.from && (!date || date < filters.from)) return false;
        if (filters.to && (!date || date > filters.to)) return false;
        if (!query) return true;

        const searchableText = [
          record.id,
          record.actor,
          record.actorId,
          action,
          role,
          module,
          record.targetId,
          record.entityId,
          record.entityType,
          record.targetName,
          record.description,
          record.reason,
          status,
        ]
          .filter((value) => typeof value === "string" || typeof value === "number")
          .join(" ")
          .toLowerCase();
        return searchableText.includes(query);
      });
  }, [filters, now, overviewFilter, records, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const pageRecords = filteredRecords.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const recentCutoff = now - 24 * 60 * 60 * 1000;
  const overview = [
    { id: "all", label: "Total Activities", value: records.length, icon: Activity },
    { id: "admins", label: "Admin Actions", value: records.filter((record) => getRecordRole(record).toLowerCase() === "admin").length, icon: Users },
    { id: "security", label: "Security Events", value: records.filter((record) => getRecordModule(record).toLowerCase().includes("security")).length, icon: ShieldCheck },
    { id: "recent", label: "Recent Changes", value: records.filter((record) => { const timestamp = new Date(record.timestamp || 0).getTime(); return timestamp >= recentCutoff && timestamp <= now; }).length, icon: Clock3 },
  ];

  function refreshRecords() {
    const state = getAdminActivityLog();
    setActivityState(state);
    setFeedback({ type: state.error ? "error" : "success", message: state.error || "Audit records refreshed from this browser." });
  }

  function applySearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function selectOverviewFilter(filterId) {
    setOverviewFilter(filterId);
    setPage(1);
  }

  function applyFilters(event) {
    event.preventDefault();
    if (filterDraft.from && filterDraft.to && filterDraft.from > filterDraft.to) {
      setFeedback({ type: "error", message: "Start date must be on or before the end date." });
      return;
    }
    setFilters({ ...filterDraft });
    setPage(1);
    setFeedback(null);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilterDraft(ALL_FILTERS);
    setFilters(ALL_FILTERS);
    setOverviewFilter("all");
    setPage(1);
    setFeedback(null);
  }

  function exportLogs() {
    try {
      const content = createCsvContent(filteredRecords, [
        { header: "Log ID", getValue: (record) => record.id || "" },
        { header: "Date & Time", getValue: (record) => record.timestamp || "" },
        { header: "Action", getValue: getRecordAction },
        { header: "Performed By", getValue: (record) => safeDisplayValue(record.actor, "Performed By") },
        { header: "User Role", getValue: getRecordRole },
        { header: "Module", getValue: getRecordModule },
        { header: "Related Record ID", getValue: (record) => record.targetId ?? record.entityId ?? "" },
        { header: "Status", getValue: getRecordStatus },
        { header: "Description", getValue: (record) => safeDisplayValue(record.description, "Description") },
      ]);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`educonnect-audit-logs-${date}.csv`, content);
      try {
        const actor = window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";
        appendAdminActivityRecord({
          actor,
          actorRole: "Admin",
          action: "Audit Logs Exported",
          category: "data-export",
          module: "Audit Logs",
          entityType: "Audit Log Export",
          entityId: date,
          targetId: date,
          targetName: "Filtered Audit Logs",
          newValue: `${filteredRecords.length} CSV records`,
          description: `Admin exported ${filteredRecords.length} filtered audit record${filteredRecords.length === 1 ? "" : "s"} as CSV.`,
          result: "Success",
        });
      } catch {
        // A log write failure must not undo a CSV download that already succeeded.
      }
      setFeedback({ type: "success", message: `Exported ${filteredRecords.length} filtered audit record${filteredRecords.length === 1 ? "" : "s"} as CSV.` });
    } catch (exportError) {
      setFeedback({ type: "error", message: exportError instanceof Error ? exportError.message : "Audit logs could not be exported." });
    }
  }

  return (
    <section className="edc-admin-activity">
      <div className="edc-admin-stat-grid edc-admin-activity-overview" aria-label="Activity overview">
        {overview.map(({ id, label, value, icon: Icon }) => (
          <button
            className={`edc-admin-stat-card edc-admin-stat-card-link edc-admin-activity-overview-card${overviewFilter === id ? " is-active" : ""}`}
            key={id}
            type="button"
            aria-pressed={overviewFilter === id}
            onClick={() => selectOverviewFilter(id)}
          >
            <span className="edc-admin-stat-icon" aria-hidden="true"><Icon size={19} /></span>
            <p>{label}</p>
            <strong>{value}</strong>
          </button>
        ))}
      </div>

      <div className="edc-admin-activity-toolbar">
        <form className="edc-admin-search edc-admin-activity-search" onSubmit={applySearch} role="search">
          <Search size={17} aria-hidden="true" />
          <label className="edc-admin-visually-hidden" htmlFor="admin-audit-search">Search audit logs</label>
          <input
            id="admin-audit-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search log ID, admin, action, user or content ID"
          />
          <button className="edc-admin-action-button" type="submit">Search</button>
        </form>
        <div className="edc-admin-activity-actions">
          <button className="edc-admin-action-button" type="button" onClick={refreshRecords}><RefreshCw size={14} /> Refresh</button>
          <button className="edc-admin-action-button" type="button" onClick={exportLogs} disabled={filteredRecords.length === 0}><Download size={14} /> Export CSV</button>
        </div>
      </div>

      <form className="edc-admin-activity-filters" onSubmit={applyFilters}>
        <label className="edc-admin-activity-date">From<input type="date" value={filterDraft.from} onChange={(event) => setFilterDraft({ ...filterDraft, from: event.target.value })} /></label>
        <label className="edc-admin-activity-date">To<input type="date" value={filterDraft.to} onChange={(event) => setFilterDraft({ ...filterDraft, to: event.target.value })} /></label>
        <label>Module<select value={filterDraft.module} onChange={(event) => setFilterDraft({ ...filterDraft, module: event.target.value })}><option value="all">All modules</option>{options.modules.map((module) => <option key={module} value={module}>{module}</option>)}</select></label>
        <label>Action<select value={filterDraft.action} onChange={(event) => setFilterDraft({ ...filterDraft, action: event.target.value })}><option value="all">All actions</option>{options.actions.map((action) => <option key={action} value={action}>{action}</option>)}</select></label>
        <label>User role<select value={filterDraft.role} onChange={(event) => setFilterDraft({ ...filterDraft, role: event.target.value })}><option value="all">All roles</option>{options.roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
        <label>Status<select value={filterDraft.status} onChange={(event) => setFilterDraft({ ...filterDraft, status: event.target.value })}><option value="all">All statuses</option>{options.statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <div className="edc-admin-activity-filter-actions">
          <button className="edc-admin-action-button" type="submit"><Filter size={14} /> Apply Filters</button>
          <button className="edc-admin-action-button edc-admin-activity-clear" type="button" onClick={clearFilters}>Clear Filters</button>
        </div>
      </form>

      {feedback && <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p>}
      {error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" /> {error} Existing audit records were kept unchanged.
        </p>
      )}

      {!error && records.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-activity-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true"><Activity size={23} /></span>
          <h3>No audit activity recorded yet.</h3>
          <p>Real successful actions will appear here when they happen. No sample records are added.</p>
        </div>
      )}

      {!error && records.length > 0 && filteredRecords.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-activity-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true"><Search size={23} /></span>
          <h3>No matching audit records found.</h3>
          <p>Try another search term or adjust the current filters.</p>
        </div>
      )}

      {!error && filteredRecords.length > 0 && (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-activity-table">
            <thead>
              <tr>
                <th scope="col">Log ID</th>
                <th scope="col">Date &amp; Time</th>
                <th scope="col">Action</th>
                <th scope="col">Performed By</th>
                <th scope="col">User Role</th>
                <th scope="col">Module</th>
                <th scope="col">Status</th>
                <th scope="col">View Details</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record, index) => (
                <tr key={record.id || `${record.timestamp}-${record.action}-${index}`}>
                  <td><code>{record.id || "Not provided"}</code></td>
                  <td><span className="edc-admin-activity-meta"><Clock3 size={12} aria-hidden="true" />{formatTimestamp(record.timestamp)}</span></td>
                  <td className="edc-admin-activity-description">{getRecordAction(record)}</td>
                  <td>{safeDisplayValue(record.actor, "Performed By") || "Admin"}</td>
                  <td>{getRecordRole(record)}</td>
                  <td><span className="edc-admin-activity-tag">{getRecordModule(record)}</span></td>
                  <td><span className={`edc-admin-status-badge ${getRecordStatus(record).toLowerCase() === "success" ? "edc-admin-status-approved" : getRecordStatus(record).toLowerCase() === "failed" ? "edc-admin-status-rejected" : "edc-admin-status-unknown"}`}>{getRecordStatus(record)}</span></td>
                  <td><button className="edc-admin-action-button" type="button" onClick={() => setSelectedRecord(record)}><Eye size={14} /> View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && filteredRecords.length > 0 && (
        <div className="edc-admin-activity-pagination">
          <p className="edc-admin-applications-count" aria-live="polite">
            Showing {Math.min((visiblePage - 1) * PAGE_SIZE + 1, filteredRecords.length)}–{Math.min(visiblePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length} filtered record{filteredRecords.length === 1 ? "" : "s"} ({records.length} total)
          </p>
          <div>
            <button className="edc-admin-filter-button" type="button" disabled={visiblePage <= 1} onClick={() => setPage((current) => Math.max(1, Math.min(pageCount, current - 1)))}>Previous</button>
            <span>Page {visiblePage} of {pageCount}</span>
            <button className="edc-admin-filter-button" type="button" disabled={visiblePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
          </div>
        </div>
      )}

      {filteredRecords.length > 0 && (
        <div className="edc-admin-activity-footer">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Read-only browser-local audit history. Records are not editable or deletable from this page.</span>
        </div>
      )}

      {selectedRecord && (
        <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedRecord(null)}>
          <section className="edc-admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="audit-record-detail-title">
            <header className="edc-admin-details-header">
              <div><span className="edc-admin-page-eyebrow">READ-ONLY AUDIT RECORD</span><h3 id="audit-record-detail-title">{getRecordAction(selectedRecord)}</h3></div>
              <button type="button" className="edc-admin-modal-close" onClick={() => setSelectedRecord(null)} aria-label="Close audit details">×</button>
            </header>
            <dl className="edc-admin-details-list">
              {recordDetails(selectedRecord).map(([label, value]) => (
                <div className="edc-admin-detail-field" key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminActivityLog;
