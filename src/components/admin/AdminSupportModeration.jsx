import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  LifeBuoy,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  SUPPORT_REQUEST_CATEGORIES,
  SUPPORT_REQUEST_PRIORITIES,
  SUPPORT_REQUEST_STATUSES,
  addAdminSupportResponse,
  createAdminSupportRequest,
  readAdminSupportRequestsState,
  updateAdminSupportRequestStatus,
} from "./adminData";

function formatTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function getPriorityBadgeClass(priority) {
  switch (String(priority || "").toLowerCase()) {
    case "urgent":
      return "edc-admin-status-rejected";
    case "high":
      return "edc-admin-priority-high";
    case "medium":
      return "edc-admin-priority-medium";
    case "low":
    default:
      return "edc-admin-status-unknown";
  }
}

function getStatusBadgeClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "open":
      return "edc-admin-status-pending";
    case "in progress":
      return "edc-admin-status-changes";
    case "resolved":
      return "edc-admin-status-approved";
    case "closed":
      return "edc-admin-status-unknown";
    default:
      return "edc-admin-status-unknown";
  }
}

function AdminSupportModeration({ email }) {
  const adminActor = email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";

  const [requests, setRequests] = useState(() => readAdminSupportRequestsState().records);
  const [storeError, setStoreError] = useState(() => readAdminSupportRequestsState().error || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Create form state
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState(SUPPORT_REQUEST_CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDescription, setNewDescription] = useState("");
  const [newRequesterName, setNewRequesterName] = useState("Demo Student");
  const [newRequesterEmail, setNewRequesterEmail] = useState("student.demo@example.com");
  const [createError, setCreateError] = useState("");

  // Response form state (inside details modal)
  const [responseMessage, setResponseMessage] = useState("");
  const [responseType, setResponseType] = useState("response"); // "response" | "internal_note"
  const [responseError, setResponseError] = useState("");

  const refreshRequests = useCallback(() => {
    const state = readAdminSupportRequestsState();
    setRequests(state.records);
    setStoreError(state.error || "");

    setSelectedRequest((current) => {
      if (!current) return null;
      return state.records.find((item) => String(item.id) === String(current.id)) || null;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshRequests);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRequests);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedRequest(null);
        setIsCreateOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("storage", refreshRequests);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRequests);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [refreshRequests]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all";

  function handleResetFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
  }

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;

      if (!matchesStatus || !matchesCategory || !matchesPriority) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        item.subject,
        item.description,
        item.requesterName,
        item.requesterEmail,
        item.category,
        item.priority,
        item.status,
        item.id,
      ]
        .filter((val) => typeof val === "string")
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [categoryFilter, priorityFilter, requests, search, statusFilter]);

  function handleOpenCreateModal() {
    setCreateError("");
    setNewSubject("");
    setNewDescription("");
    setNewCategory(SUPPORT_REQUEST_CATEGORIES[0]);
    setNewPriority("Medium");
    setNewRequesterName("Demo Student");
    setNewRequesterEmail("student.demo@example.com");
    setIsCreateOpen(true);
  }

  function handleCreateSubmit(event) {
    event.preventDefault();
    setCreateError("");

    try {
      const created = createAdminSupportRequest({
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        requesterName: newRequesterName,
        requesterEmail: newRequesterEmail,
        actor: adminActor,
      });

      setIsCreateOpen(false);
      setFeedback({
        type: "success",
        message: `Demo support request #${created.id} was created successfully and saved in browser storage.`,
      });
      refreshRequests();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create support request.");
    }
  }

  function handleStatusChange(requestId, nextStatus) {
    setFeedback(null);
    try {
      updateAdminSupportRequestStatus(requestId, nextStatus, adminActor);
      setFeedback({
        type: "success",
        message: `Request status updated to "${nextStatus}".`,
      });
      refreshRequests();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update request status.",
      });
    }
  }

  function handleAddResponseSubmit(event) {
    event.preventDefault();
    setResponseError("");

    if (!selectedRequest) return;

    try {
      addAdminSupportResponse(selectedRequest.id, {
        message: responseMessage,
        type: responseType,
        author: adminActor,
        actor: adminActor,
      });

      setResponseMessage("");
      refreshRequests();
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : "Failed to add response.");
    }
  }

  return (
    <section className="edc-admin-support-moderation">
      {/* Notice & Context */}
      <div className="edc-admin-security-notice" style={{ margin: "0 0 18px" }}>
        <LifeBuoy size={16} aria-hidden="true" />
        <div>
          <strong>Browser-Local Support &amp; Moderation Demo</strong>
          <p>
            Support requests, status transitions, and notes are managed in this browser’s <code>localStorage</code>.
            Records are simulated for administrative demo purposes and are not dispatched to an external helpdesk or ticketing service.
          </p>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <p
          className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
          style={{ marginBottom: "16px" }}
        >
          {feedback.message}
        </p>
      )}

      {/* Storage Error Warning */}
      {storeError && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert" style={{ marginBottom: "16px" }}>
          <AlertTriangle size={16} aria-hidden="true" />
          {storeError} Existing browser storage was preserved.
        </p>
      )}

      {/* Toolbar */}
      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search edc-admin-support-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search support requests</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by subject, requester, category, or ID..."
          />
        </label>

        <div className="edc-admin-application-filters" aria-label="Filter support records">
          <select
            className="edc-admin-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {SUPPORT_REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="edc-admin-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {SUPPORT_REQUEST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="edc-admin-select"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            {SUPPORT_REQUEST_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority} Priority
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="edc-admin-action-button"
              onClick={handleResetFilters}
              title="Reset all search and filter values"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          )}

          <button
            type="button"
            className="edc-admin-action-button edc-admin-support-create-btn"
            onClick={handleOpenCreateModal}
          >
            <Plus size={15} aria-hidden="true" />
            Create Demo Request
          </button>
        </div>
      </div>

      {/* Empty State: No requests exist at all */}
      {!storeError && requests.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-support-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <LifeBuoy size={24} />
          </span>
          <h3>No support requests found</h3>
          <p>
            There are currently no support requests or user appeals stored in this browser session.
            You can create a new demo support request to test the administrative review, status management, and note-taking workflow.
          </p>
          <button
            type="button"
            className="edc-admin-action-button edc-admin-support-create-btn"
            style={{ marginTop: "14px" }}
            onClick={handleOpenCreateModal}
          >
            <Plus size={15} aria-hidden="true" />
            Create Demo Support Request
          </button>
        </div>
      )}

      {/* Empty State: Search or filters yield zero results */}
      {!storeError && requests.length > 0 && filteredRequests.length === 0 && (
        <div className="edc-admin-applications-empty edc-admin-support-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <Search size={24} />
          </span>
          <h3>No matching support requests</h3>
          <p>No support records matched your active search term or filter parameters.</p>
          <button
            type="button"
            className="edc-admin-action-button"
            style={{ marginTop: "12px" }}
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset Search &amp; Filters
          </button>
        </div>
      )}

      {/* Requests Table */}
      {!storeError && filteredRequests.length > 0 && (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table edc-admin-support-table">
            <thead>
              <tr>
                <th scope="col">Subject</th>
                <th scope="col">Requester</th>
                <th scope="col">Category</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((item) => {
                const responseCount = Array.isArray(item.responses) ? item.responses.length : 0;
                return (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <strong>{item.subject}</strong>
                        <span title={item.id}>
                          #{item.id}
                          {responseCount > 0 && ` · ${responseCount} note${responseCount === 1 ? "" : "s"}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{item.requesterName}</strong>
                        <span>{item.requesterEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className="edc-admin-activity-tag">{item.category}</span>
                    </td>
                    <td>
                      <span className={`edc-admin-status-badge ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`edc-admin-status-badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className="edc-admin-activity-meta">
                        <Clock3 size={12} aria-hidden="true" />
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="edc-admin-action-button"
                        onClick={() => setSelectedRequest(item)}
                      >
                        <Eye size={14} aria-hidden="true" />
                        View details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Count Info */}
      {!storeError && requests.length > 0 && (
        <p className="edc-admin-applications-count" aria-live="polite">
          Showing {filteredRequests.length} of {requests.length} support request{requests.length === 1 ? "" : "s"}
        </p>
      )}

      {/* CREATE SUPPORT REQUEST MODAL */}
      {isCreateOpen && (
        <div className="edc-admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-request-title">
          <div className="edc-admin-details-modal edc-admin-support-modal">
            <div className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">ADMIN DEMO WORKFLOW</span>
                <h3 id="create-request-title">Create Demo Support Request</h3>
              </div>
              <button
                type="button"
                className="edc-admin-modal-close"
                aria-label="Close dialog"
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ marginTop: "16px" }}>
              {createError && (
                <p className="edc-admin-feedback edc-admin-feedback-error" role="alert" style={{ marginBottom: "14px" }}>
                  {createError}
                </p>
              )}

              <div className="edc-admin-support-form-grid">
                <label className="edc-admin-support-form-field">
                  <span>Subject *</span>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Unable to open course assessment"
                  />
                </label>

                <div className="edc-admin-support-form-row">
                  <label className="edc-admin-support-form-field">
                    <span>Category *</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      {SUPPORT_REQUEST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="edc-admin-support-form-field">
                    <span>Priority *</span>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      {SUPPORT_REQUEST_PRIORITIES.map((pri) => (
                        <option key={pri} value={pri}>
                          {pri}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="edc-admin-support-form-row">
                  <label className="edc-admin-support-form-field">
                    <span>Requester Name</span>
                    <input
                      type="text"
                      value={newRequesterName}
                      onChange={(e) => setNewRequesterName(e.target.value)}
                      placeholder="e.g., Jane Student"
                    />
                  </label>

                  <label className="edc-admin-support-form-field">
                    <span>Requester Email</span>
                    <input
                      type="email"
                      value={newRequesterEmail}
                      onChange={(e) => setNewRequesterEmail(e.target.value)}
                      placeholder="e.g., student@example.com"
                    />
                  </label>
                </div>

                <label className="edc-admin-support-form-field">
                  <span>Description *</span>
                  <textarea
                    rows={4}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe the issue, user inquiry, or account moderation problem..."
                  />
                </label>
              </div>

              <div className="edc-admin-security-notice" style={{ margin: "16px 0 0" }}>
                <ShieldAlert size={15} aria-hidden="true" />
                <p>
                  This demo request is stored in this browser’s localStorage. It is not sent to any external server or email service.
                </p>
              </div>

              <div className="edc-admin-settings-actions" style={{ marginTop: "18px" }}>
                <button type="submit" className="edc-admin-settings-save">
                  <Plus size={15} aria-hidden="true" />
                  Create Support Request
                </button>
                <button
                  type="button"
                  className="edc-admin-settings-reset"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST DETAILS MODAL */}
      {selectedRequest && (
        <div className="edc-admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="details-request-title">
          <div className="edc-admin-details-modal edc-admin-support-modal">
            <div className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">SUPPORT REQUEST DETAILS</span>
                <h3 id="details-request-title">{selectedRequest.subject}</h3>
                <span className="edc-admin-support-id-tag">#{selectedRequest.id}</span>
              </div>
              <button
                type="button"
                className="edc-admin-modal-close"
                aria-label="Close details"
                onClick={() => setSelectedRequest(null)}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            {/* Meta details list */}
            <dl className="edc-admin-details-list" style={{ marginTop: "16px" }}>
              <div className="edc-admin-detail-field">
                <dt>Current Status</dt>
                <dd>
                  <span className={`edc-admin-status-badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </dd>
              </div>

              <div className="edc-admin-detail-field">
                <dt>Priority Level</dt>
                <dd>
                  <span className={`edc-admin-status-badge ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                    {selectedRequest.priority} Priority
                  </span>
                </dd>
              </div>

              <div className="edc-admin-detail-field">
                <dt>Category</dt>
                <dd>
                  <span className="edc-admin-activity-tag">{selectedRequest.category}</span>
                </dd>
              </div>

              <div className="edc-admin-detail-field">
                <dt>Requester</dt>
                <dd>
                  <strong>{selectedRequest.requesterName}</strong> ({selectedRequest.requesterEmail})
                </dd>
              </div>

              <div className="edc-admin-detail-field">
                <dt>Created Date</dt>
                <dd>{formatTimestamp(selectedRequest.createdAt)}</dd>
              </div>

              <div className="edc-admin-detail-field">
                <dt>Last Updated</dt>
                <dd>{formatTimestamp(selectedRequest.updatedAt)}</dd>
              </div>
            </dl>

            {/* Problem Description */}
            <div className="edc-admin-support-desc-box">
              <span className="edc-admin-support-box-label">Description</span>
              <p>{selectedRequest.description}</p>
            </div>

            {/* Status Management */}
            <div className="edc-admin-support-status-section">
              <span className="edc-admin-support-box-label">Update Request Status</span>
              <div className="edc-admin-support-status-buttons">
                {SUPPORT_REQUEST_STATUSES.map((status) => {
                  const isActive = selectedRequest.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`edc-admin-action-button ${isActive ? "edc-admin-support-status-btn-active" : ""}`}
                      onClick={() => handleStatusChange(selectedRequest.id, status)}
                      disabled={isActive}
                    >
                      {status === "Resolved" && <CheckCircle2 size={13} aria-hidden="true" />}
                      {status === "Closed" && <Lock size={13} aria-hidden="true" />}
                      Mark as {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Responses & Notes Thread */}
            <div className="edc-admin-support-thread-section">
              <span className="edc-admin-support-box-label">
                Responses &amp; Internal Notes ({Array.isArray(selectedRequest.responses) ? selectedRequest.responses.length : 0})
              </span>

              {(!Array.isArray(selectedRequest.responses) || selectedRequest.responses.length === 0) ? (
                <p className="edc-admin-support-thread-empty">
                  No responses or internal notes have been recorded for this request yet.
                </p>
              ) : (
                <div className="edc-admin-support-thread-list">
                  {selectedRequest.responses.map((resp) => {
                    const isInternal = resp.type === "internal_note";
                    return (
                      <div
                        key={resp.id}
                        className={`edc-admin-support-thread-item ${
                          isInternal ? "edc-admin-support-thread-internal" : "edc-admin-support-thread-response"
                        }`}
                      >
                        <div className="edc-admin-support-thread-header">
                          <span className="edc-admin-support-thread-author">
                            {isInternal ? <Lock size={12} aria-hidden="true" /> : <MessageSquare size={12} aria-hidden="true" />}
                            <strong>{resp.author || "Admin"}</strong>
                            <small>({isInternal ? "Internal Note" : "Admin Response"})</small>
                          </span>
                          <time>{formatTimestamp(resp.createdAt)}</time>
                        </div>
                        <p className="edc-admin-support-thread-message">{resp.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Response / Note Form */}
              <form onSubmit={handleAddResponseSubmit} className="edc-admin-support-add-response-form">
                {responseError && (
                  <p className="edc-admin-feedback edc-admin-feedback-error" role="alert" style={{ marginBottom: "10px" }}>
                    {responseError}
                  </p>
                )}

                <div className="edc-admin-support-response-type-row">
                  <label className="edc-admin-support-radio-label">
                    <input
                      type="radio"
                      name="responseType"
                      value="response"
                      checked={responseType === "response"}
                      onChange={() => setResponseType("response")}
                    />
                    <span>Public Admin Response</span>
                  </label>

                  <label className="edc-admin-support-radio-label">
                    <input
                      type="radio"
                      name="responseType"
                      value="internal_note"
                      checked={responseType === "internal_note"}
                      onChange={() => setResponseType("internal_note")}
                    />
                    <span>Internal Admin Note</span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  required
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    responseType === "internal_note"
                      ? "Add an internal administrative note (visible only to admins in this demo)..."
                      : "Type a response to this support request..."
                  }
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button type="submit" className="edc-admin-settings-save">
                    <Send size={14} aria-hidden="true" />
                    {responseType === "internal_note" ? "Save Internal Note" : "Post Response"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminSupportModeration;
