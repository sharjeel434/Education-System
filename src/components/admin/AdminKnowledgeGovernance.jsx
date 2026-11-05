import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  Check,
  CheckCircle2,
  Eye,
  FilePlus2,
  Info,
  Search,
  X,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  appendAdminActivityRecord,
  createAdminKnowledgeProposal,
  getAdminCourses,
  getAdminKnowledgeStorageState,
  getAdminTeachers,
  readAdminArray,
  updateAdminKnowledgeProposal,
} from "./adminData";

const KNOWLEDGE_FILTERS = [
  ["all", "All Proposals"],
  ["Pending Review", "Pending Review"],
  ["Approved for Processing", "Approved for Processing"],
  ["Changes Requested", "Changes Requested"],
  ["Rights Evidence Requested", "Rights Evidence Requested"],
  ["Rejected", "Rejected"],
];

function displayValue(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || "Not provided";
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => item.trim()).filter(Boolean).join(", ") || "Not provided";
  }
  return "Not provided";
}

function formatDate(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Not provided";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString();
}

function statusClass(status) {
  switch (status) {
    case "Pending Review":
      return "edc-admin-status-pending";
    case "Approved for Processing":
      return "edc-admin-status-approved";
    case "Changes Requested":
    case "Rights Evidence Requested":
      return "edc-admin-status-changes";
    case "Rejected":
      return "edc-admin-status-rejected";
    default:
      return "edc-admin-status-unknown";
  }
}

function proposalKey(proposal) {
  return String(proposal.proposalId ?? "");
}

function courseKey(course) {
  return `${String(course.teacherEmail || "").trim().toLowerCase()}:${String(course.id ?? "")}`;
}

function readCourseChoices() {
  const users = readAdminArray(ADMIN_USERS_KEY);
  const teachers = getAdminTeachers(users);
  const teacherByEmail = new Map(
    teachers.map((teacher) => [
      teacher.email.trim().toLowerCase(),
      teacher,
    ]),
  );

  return getAdminCourses(users).map((course) => {
    const teacher = teacherByEmail.get(
      String(course.teacherEmail || "").trim().toLowerCase(),
    );
    let profile = {};
    try {
      const savedProfile = JSON.parse(
        window.localStorage.getItem(
          `educonnect.teacher.${course.teacherEmail}.profile`,
        ) || "{}",
      );
      if (
        savedProfile !== null &&
        typeof savedProfile === "object" &&
        !Array.isArray(savedProfile)
      ) {
        profile = savedProfile;
      }
    } catch {
      profile = {};
    }

    return {
      course,
      teacherName:
        displayValue(teacher?.name) !== "Not provided"
          ? displayValue(teacher?.name)
          : displayValue(profile.name),
    };
  });
}

function renderCourseContent(course) {
  if (!course) {
    return (
      <p className="edc-admin-knowledge-muted">
        The related course is no longer available in the teacher course records.
      </p>
    );
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  return (
    <div className="edc-admin-knowledge-course-content">
      <dl className="edc-admin-knowledge-detail-grid">
        <div>
          <dt>Course title</dt>
          <dd>{displayValue(course.title)}</dd>
        </div>
        <div>
          <dt>Subject or category</dt>
          <dd>{displayValue(course.category ?? course.subject)}</dd>
        </div>
        <div>
          <dt>Academic level</dt>
          <dd>{displayValue(course.level)}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{displayValue(course.language)}</dd>
        </div>
        <div className="edc-admin-knowledge-detail-wide">
          <dt>Course description</dt>
          <dd className="edc-admin-knowledge-prewrap">
            {displayValue(course.description)}
          </dd>
        </div>
      </dl>

      <h5>Available lessons and content</h5>
      {lessons.length ? (
        <ol className="edc-admin-knowledge-lessons">
          {lessons.map((lesson, index) => (
            <li key={lesson?.id ?? `${index}-${lesson?.title ?? "lesson"}`}>
              <strong>{displayValue(lesson?.title)}</strong>
              <span>{displayValue(lesson?.description)}</span>
              {lesson?.duration !== undefined && lesson.duration !== "" && (
                <small>Duration: {displayValue(lesson.duration)}</small>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="edc-admin-knowledge-muted">
          No lesson content is available in this course record.
        </p>
      )}
    </div>
  );
}

function AdminKnowledgeGovernance() {
  const [proposals, setProposals] = useState(
    () => getAdminKnowledgeStorageState().proposals,
  );
  const [storeError, setStoreError] = useState(
    () => getAdminKnowledgeStorageState().error || "",
  );
  const [courseChoices, setCourseChoices] = useState(readCourseChoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCourseKey, setSelectedCourseKey] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  const refreshData = useCallback(() => {
    const state = getAdminKnowledgeStorageState();
    setProposals(state.proposals);
    setStoreError(state.error || "");
    setCourseChoices(readCourseChoices());
    setSelectedProposal((current) =>
      current
        ? state.proposals.find(
            (proposal) => proposalKey(proposal) === proposalKey(current),
          ) ?? null
        : null,
    );
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshData);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshData);

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setSelectedProposal(null);
        setCreateDialogOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("storage", refreshData);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshData);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [refreshData]);

  useEffect(() => {
    if (selectedProposal || createDialogOpen) {
      closeButtonRef.current?.focus();
    } else {
      returnFocusRef.current?.focus();
    }
  }, [selectedProposal, createDialogOpen]);

  const existingCourseKeys = useMemo(
    () =>
      new Set(
        proposals.map(
          (proposal) =>
            `${String(proposal.teacherEmail || "").trim().toLowerCase()}:${String(proposal.courseId ?? "")}`,
        ),
      ),
    [proposals],
  );
  const availableCourses = useMemo(
    () =>
      courseChoices.filter(
        ({ course }) => !existingCourseKeys.has(courseKey(course)),
      ),
    [courseChoices, existingCourseKeys],
  );

  const filteredProposals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return proposals.filter((proposal) => {
      const matchesStatus =
        statusFilter === "all" || proposal.status === statusFilter;
      const searchableText = [
        proposal.proposedTopic,
        proposal.teacherName,
        proposal.subject,
        proposal.courseSnapshot?.title,
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [proposals, search, statusFilter]);

  function openProposal(proposal, event) {
    returnFocusRef.current = event.currentTarget;
    setReviewNote(
      typeof proposal.reviewNotes === "string" ? proposal.reviewNotes : "",
    );
    setError("");
    setSelectedProposal(proposal);
  }

  function handleDialogKeyDown(event) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), select:not(:disabled), input:not(:disabled)',
      ),
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function submitCourseProposal(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    const choice = availableCourses.find(
      ({ course }) => courseKey(course) === selectedCourseKey,
    );
    if (!choice) {
      setError("Select an available course before creating a proposal.");
      return;
    }

    try {
      createAdminKnowledgeProposal(choice.course, choice.teacherName);
      refreshData();
      setCreateDialogOpen(false);
      setSelectedCourseKey("");
      setFeedback(
        "Knowledge proposal created from the selected course. No AI processing was started.",
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The knowledge proposal could not be created.",
      );
    }
  }

  function submitReviewDecision(status) {
    setFeedback("");
    setError("");
    if (status !== "Approved for Processing" && reviewNote.trim().length < 10) {
      setError("Add a meaningful review note of at least 10 characters.");
      return;
    }
    if (
      status === "Rejected" &&
      !window.confirm(
        "Reject this knowledge proposal? The original course and its content will be preserved.",
      )
    ) {
      return;
    }

    try {
      updateAdminKnowledgeProposal(
        selectedProposal.proposalId,
        status,
        reviewNote,
      );
      const manager = window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";
      appendAdminActivityRecord({
        id: `knowledge-${selectedProposal.proposalId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: manager,
        action:
          status === "Approved for Processing"
            ? "approved_for_processing"
            : status === "Rejected"
              ? "rejected"
              : status === "Rights Evidence Requested"
                ? "rights_evidence_requested"
                : "changes_requested",
        category: "ai-knowledge",
        entityType: "Knowledge Proposal",
        entityId: String(selectedProposal.proposalId ?? "unknown"),
        targetName: displayValue(selectedProposal.proposedTopic),
        description:
          status === "Approved for Processing"
            ? "Knowledge proposal approved"
            : status === "Rejected"
              ? "Knowledge proposal rejected"
              : status === "Rights Evidence Requested"
                ? "Rights evidence requested for knowledge proposal"
                : "Knowledge proposal change request",
        result: "Success",
      });
      refreshData();
      setSelectedProposal(null);
      setFeedback(
        status === "Approved for Processing"
          ? "Proposal approved for a future processing stage. No content was ingested or published."
          : status === "Rejected"
            ? "Proposal rejected with the review reason saved. The course was not changed."
            : status === "Rights Evidence Requested"
              ? "Rights evidence was requested and recorded. No notification was sent."
              : "Changes requested and the review note was saved. No notification was sent.",
      );
      setReviewNote("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "The proposal decision could not be saved.",
      );
    }
  }

  const selectedCourse = selectedProposal?.courseSnapshot;
  const proposalStats = {
    total: proposals.length,
    pending: proposals.filter((proposal) => proposal.status === "Pending Review").length,
    approved: proposals.filter(
      (proposal) => proposal.status === "Approved for Processing",
    ).length,
    rejected: proposals.filter((proposal) => proposal.status === "Rejected").length,
  };

  return (
    <section className="edc-admin-knowledge">
      <div className="edc-admin-knowledge-heading">
        <p>
          This demo stores separate knowledge-review proposals. Course approval
          does not create or approve a proposal.
        </p>
        <button
          className="edc-admin-knowledge-create"
          type="button"
          disabled={Boolean(storeError) || availableCourses.length === 0}
          title={
            storeError
              ? "Proposal storage is unavailable."
              : availableCourses.length === 0
                ? "There are no unsubmitted courses available."
                : undefined
          }
          onClick={() => {
            returnFocusRef.current = document.activeElement;
            setError("");
            setFeedback("");
            setCreateDialogOpen(true);
          }}
        >
          <FilePlus2 size={16} aria-hidden="true" />
          Submit a course for knowledge review
        </button>
      </div>

      {storeError && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <Info size={16} aria-hidden="true" />
          {storeError} Existing saved data was not overwritten.
        </p>
      )}
      {feedback && (
        <p className="edc-admin-feedback edc-admin-feedback-success" role="status">
          <Check size={16} aria-hidden="true" />
          {feedback}
        </p>
      )}
      {error && !selectedProposal && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <Info size={16} aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="edc-admin-knowledge-stats" aria-label="Proposal summary">
        {[
          ["Total Proposals", proposalStats.total],
          ["Pending Review", proposalStats.pending],
          ["Approved for Processing", proposalStats.approved],
          ["Rejected", proposalStats.rejected],
        ].map(([label, value]) => (
          <article className="edc-admin-stat-card" key={label}>
            <span className="edc-admin-stat-icon" aria-hidden="true">
              <BookOpenCheck size={19} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="edc-admin-applications-toolbar edc-admin-knowledge-toolbar">
        <label className="edc-admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search proposals</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by topic, course or teacher"
          />
        </label>
        <div
          className="edc-admin-application-filters"
          aria-label="Filter knowledge proposals"
        >
          {KNOWLEDGE_FILTERS.map(([id, label]) => (
            <button
              className={`edc-admin-filter-button${statusFilter === id ? " edc-admin-filter-button-active" : ""}`}
              type="button"
              key={id}
              aria-pressed={statusFilter === id}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="edc-admin-knowledge-demo-note">
        “Approved for Processing” records an Admin decision only. This frontend
        demo does not perform document extraction, AI review, embeddings,
        ingestion, or shared-knowledge publication.
      </p>

      {filteredProposals.length ? (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table edc-admin-knowledge-table">
            <thead>
              <tr>
                <th scope="col">Proposed topic</th>
                <th scope="col">Related course</th>
                <th scope="col">Teacher</th>
                <th scope="col">Subject</th>
                <th scope="col">Submitted</th>
                <th scope="col">Knowledge status</th>
                <th scope="col">Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal) => (
                <tr key={proposalKey(proposal)}>
                  <td><strong>{displayValue(proposal.proposedTopic)}</strong></td>
                  <td>{displayValue(proposal.courseSnapshot?.title)}</td>
                  <td>{displayValue(proposal.teacherName)}</td>
                  <td>{displayValue(proposal.subject)}</td>
                  <td>{formatDate(proposal.submittedAt)}</td>
                  <td>
                    <span className={`edc-admin-status-badge ${statusClass(proposal.status)}`}>
                      {displayValue(proposal.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="edc-admin-action-button"
                      type="button"
                      onClick={(event) => openProposal(proposal, event)}
                    >
                      <Eye size={14} aria-hidden="true" />
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="edc-admin-applications-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <BookOpenCheck size={22} />
          </span>
          <h3>{proposals.length ? "No proposals match this view" : "No knowledge proposals yet"}</h3>
          <p>
            {proposals.length
              ? "Try another search or status filter."
              : "An Admin can explicitly submit an existing course for separate knowledge review."}
          </p>
        </div>
      )}
      <p className="edc-admin-applications-count">
        Showing {filteredProposals.length} of {proposals.length} proposal
        {proposals.length === 1 ? "" : "s"}
      </p>

      {createDialogOpen && (
        <div
          className="edc-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateDialogOpen(false);
          }}
        >
          <section
            className="edc-admin-details-modal edc-admin-knowledge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edc-admin-knowledge-create-title"
            onKeyDown={handleDialogKeyDown}
          >
            <header className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">EXPLICIT DEMO SUBMISSION</span>
                <h3 id="edc-admin-knowledge-create-title">Submit a course for knowledge review</h3>
              </div>
              <button
                className="edc-admin-modal-close"
                type="button"
                aria-label="Close submission dialog"
                ref={closeButtonRef}
                onClick={() => setCreateDialogOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <form onSubmit={submitCourseProposal}>
              <p className="edc-admin-knowledge-muted">
                Select a real teacher course. Its available title, description,
                category, level, language and lesson text will be copied into a
                separate proposal snapshot. Nothing is processed or published.
              </p>
              {availableCourses.length ? (
                <label className="edc-admin-knowledge-form-field">
                  <span>Existing course</span>
                  <select
                    required
                    value={selectedCourseKey}
                    onChange={(event) => setSelectedCourseKey(event.target.value)}
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map(({ course, teacherName }) => (
                      <option key={courseKey(course)} value={courseKey(course)}>
                        {displayValue(course.title)} — {teacherName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="edc-admin-applications-empty edc-admin-applications-empty-compact">
                  <strong>No eligible courses</strong>
                  <p>Every available course already has a proposal, or no teacher courses exist.</p>
                </div>
              )}
              {error && (
                <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
                  <Info size={16} aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="edc-admin-details-actions">
                <button
                  className="edc-admin-action-button"
                  type="button"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="edc-admin-action-button edc-admin-action-approve"
                  type="submit"
                  disabled={!selectedCourseKey || Boolean(storeError)}
                >
                  <FilePlus2 size={14} aria-hidden="true" />
                  Create proposal
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedProposal && (
        <div
          className="edc-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProposal(null);
          }}
        >
          <section
            className="edc-admin-details-modal edc-admin-knowledge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edc-admin-knowledge-details-title"
            onKeyDown={handleDialogKeyDown}
          >
            <header className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">KNOWLEDGE PROPOSAL</span>
                <h3 id="edc-admin-knowledge-details-title">
                  {displayValue(selectedProposal.proposedTopic)}
                </h3>
              </div>
              <button
                className="edc-admin-modal-close"
                type="button"
                aria-label="Close proposal details"
                ref={closeButtonRef}
                onClick={() => setSelectedProposal(null)}
              >
                <X size={18} />
              </button>
            </header>

            <dl className="edc-admin-knowledge-detail-grid">
              <div>
                <dt>Teacher</dt>
                <dd>{displayValue(selectedProposal.teacherName)}</dd>
              </div>
              <div>
                <dt>Related course</dt>
                <dd>{displayValue(selectedCourse?.title)}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{displayValue(selectedProposal.subject)}</dd>
              </div>
              <div>
                <dt>Academic level</dt>
                <dd>{displayValue(selectedProposal.academicLevel)}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{displayValue(selectedProposal.language)}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(selectedProposal.submittedAt)}</dd>
              </div>
              <div>
                <dt>Review status</dt>
                <dd>
                  <span className={`edc-admin-status-badge ${statusClass(selectedProposal.status)}`}>
                    {displayValue(selectedProposal.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Rights evidence</dt>
                <dd>{displayValue(selectedProposal.rightsEvidenceStatus ?? selectedProposal.rightsStatus)}</dd>
              </div>
            </dl>

            <section className="edc-admin-knowledge-detail-section">
              <h4>Proposal content</h4>
              {renderCourseContent(selectedCourse)}
            </section>
            <div className="edc-admin-knowledge-detail-grid">
              <div>
                <h4>Source references</h4>
                <p>{displayValue(selectedProposal.sourceReferences)}</p>
              </div>
              <div>
                <h4>Existing knowledge coverage</h4>
                <p>{displayValue(selectedProposal.existingCoverage)}</p>
              </div>
            </div>
            <section className="edc-admin-knowledge-detail-section">
              <h4>Admin review notes</h4>
              <p className="edc-admin-knowledge-prewrap">
                {displayValue(selectedProposal.reviewNotes)}
              </p>
            </section>

            {selectedProposal.status === "Pending Review" && (
              <div className="edc-admin-knowledge-review">
                <label className="edc-admin-knowledge-form-field">
                  <span>
                    Review note
                    <small>
                      Required for changes, rights evidence, and rejection
                      (minimum 10 characters).
                    </small>
                  </span>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Record the reason for your review decision."
                  />
                </label>
                {error && (
                  <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
                    <Info size={16} aria-hidden="true" />
                    {error}
                  </p>
                )}
                <p className="edc-admin-knowledge-disclaimer">
                  Approval is only permission to consider a future processing
                  stage. It does not ingest content, generate embeddings, or
                  publish shared AI knowledge. Rights evidence is not verified
                  by this demo.
                </p>
                <div className="edc-admin-details-actions">
                  <button
                    className="edc-admin-action-button edc-admin-action-approve"
                    type="button"
                    onClick={() => submitReviewDecision("Approved for Processing")}
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Approve for processing
                  </button>
                  <button
                    className="edc-admin-action-button"
                    type="button"
                    onClick={() => submitReviewDecision("Changes Requested")}
                  >
                    Request changes
                  </button>
                  <button
                    className="edc-admin-action-button"
                    type="button"
                    onClick={() => submitReviewDecision("Rights Evidence Requested")}
                  >
                    Request rights evidence
                  </button>
                  <button
                    className="edc-admin-action-button edc-admin-action-reject"
                    type="button"
                    onClick={() => submitReviewDecision("Rejected")}
                  >
                    Reject proposal
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminKnowledgeGovernance;
