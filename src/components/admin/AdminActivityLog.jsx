import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Search, ShieldCheck, Clock3 } from "lucide-react";
import {
  ADMIN_ACTIVITY_CATEGORY_LABELS,
  ADMIN_DATA_CHANGED_EVENT,
  getAdminActivityLog,
} from "./adminData";

const CATEGORY_FILTERS = [
  { id: "all", label: "All Activities" },
  { id: "teacher-applications", label: "Teacher Applications" },
  { id: "course-review", label: "Course Review" },
  { id: "ai-knowledge", label: "AI Knowledge Governance" },
  { id: "data-import", label: "Data Import" },
  { id: "security", label: "Security & Access" },
  { id: "support", label: "Support & Moderation" },
];

function formatTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not provided";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function AdminActivityLog() {
  const [records, setRecords] = useState(() => getAdminActivityLog().records);
  const [error, setError] = useState(() => getAdminActivityLog().error || "");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    function refreshRecords() {
      const state = getAdminActivityLog();
      setRecords(state.records);
      setError(state.error || "");
    }

    window.addEventListener("storage", refreshRecords);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRecords);

    return () => {
      window.removeEventListener("storage", refreshRecords);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRecords);
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .sort((first, second) => {
        const left = new Date(first.timestamp || 0).getTime();
        const right = new Date(second.timestamp || 0).getTime();
        return right - left;
      })
      .filter((record) => {
        const matchesCategory =
          categoryFilter === "all" || record.category === categoryFilter;

        if (!matchesCategory) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchableText = [
          record.description,
          record.action,
          record.entityType,
          record.entityId,
          record.targetName,
          record.actor,
          record.result,
          ADMIN_ACTIVITY_CATEGORY_LABELS[record.category],
        ]
          .filter((value) => typeof value === "string")
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
  }, [categoryFilter, records, search]);

  return (
    <section className="edc-admin-activity">
      <div className="edc-admin-activity-toolbar">
        <label className="edc-admin-search edc-admin-activity-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search admin activity</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by action, target or admin"
          />
        </label>

        <div className="edc-admin-activity-filter-group" aria-label="Filter activity log">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`edc-admin-filter-button${categoryFilter === filter.id ? " edc-admin-filter-button-active" : ""}`}
              aria-pressed={categoryFilter === filter.id}
              onClick={() => setCategoryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {error} Existing activity records were kept unchanged.
        </p>
      )}

      {!error && records.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-activity-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <Activity size={23} />
          </span>
          <h3>No Admin activity recorded yet.</h3>
          <p>Successful admin actions will appear here once they are completed.</p>
        </div>
      )}

      {!error && records.length > 0 && filteredRecords.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-activity-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <Search size={23} />
          </span>
          <h3>No matching activity found.</h3>
          <p>Try a different search term or adjust the current activity filter.</p>
        </div>
      )}

      {!error && filteredRecords.length > 0 && (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-activity-table">
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">Description</th>
                <th scope="col">Action</th>
                <th scope="col">Category</th>
                <th scope="col">Target</th>
                <th scope="col">Admin</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id || `${record.timestamp}-${record.action}`}>
                  <td>
                    <span className="edc-admin-activity-meta">
                      <Clock3 size={12} aria-hidden="true" />
                      {formatTimestamp(record.timestamp)}
                    </span>
                  </td>
                  <td className="edc-admin-activity-description">
                    {normalizeText(record.description) || "No description available"}
                  </td>
                  <td>{normalizeText(record.action) || "Unknown action"}</td>
                  <td>
                    <span className="edc-admin-activity-tag">
                      {ADMIN_ACTIVITY_CATEGORY_LABELS[record.category] || record.category || "Admin"}
                    </span>
                  </td>
                  <td>
                    <div className="edc-admin-activity-target">
                      <strong>{normalizeText(record.targetName) || "Not provided"}</strong>
                      <small>{normalizeText(record.entityType) || "Record"} #{normalizeText(record.entityId) || "N/A"}</small>
                    </div>
                  </td>
                  <td>{normalizeText(record.actor) || "Admin"}</td>
                  <td>
                    <span className={`edc-admin-status-badge ${record.result === "Success" ? "edc-admin-status-approved" : record.result === "Failed" ? "edc-admin-status-rejected" : "edc-admin-status-unknown"}`}>
                      {normalizeText(record.result) || "Success"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="edc-admin-applications-count" aria-live="polite">
        Showing {filteredRecords.length} of {records.length} admin activity record
        {records.length === 1 ? "" : "s"}
      </p>

      {filteredRecords.length > 0 && (
        <div className="edc-admin-activity-footer">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>This log is a browser-local activity history for the current demo.</span>
        </div>
      )}
    </section>
  );
}

export default AdminActivityLog;
