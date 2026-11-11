import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  ExternalLink,
  Info,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  appendAdminActivityRecord,
  getAdminCourses,
  getAdminTeachers,
  readAdminArray,
  updateAdminCourseStatus,
} from "./adminData";

const STATUS_ORDER = [
  "Draft",
  "Submitted",
  "AI Review",
  "Admin Review",
  "Pending Approval",
  "Changes Requested",
  "Approved",
  "Published",
  "Rejected",
  "Suspended",
];
const AI_REPORT_FIELDS = [
  ["status", "Status"],
  ["summary", "Summary"],
  ["completeness", "Completeness"],
  ["quality", "Quality"],
  ["pedagogy", "Pedagogy"],
  ["accuracy", "Accuracy"],
  ["safety", "Safety"],
  ["originality", "Originality"],
  ["rights", "Rights"],
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

function formatCourseDate(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Not provided";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString();
}

function formatSubmissionDate(course) {
  const dates = [
    course.submittedAt,
    course.submissionDate,
    course.submittedOn,
    course.submittedDate,
  ];

  for (const date of dates) {
    const formatted = formatCourseDate(date);
    if (formatted !== "Not provided") return formatted;
  }

  return "Not provided";
}

function courseStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending approval":
    case "submitted":
    case "draft":
      return "edc-admin-status-pending";
    case "approved":
      return "edc-admin-status-approved";
    case "published":
      return "edc-admin-status-published";
    case "changes requested":
    case "admin review":
    case "ai review":
      return "edc-admin-status-changes";
    case "rejected":
    case "suspended":
      return "edc-admin-status-rejected";
    default:
      return "edc-admin-status-unknown";
  }
}

function getCourseFilters(courses) {
  const statuses = new Set(
    courses
      .map((course) => course.status)
      .filter((status) => typeof status === "string" && status.trim()),
  );
  const ordered = STATUS_ORDER.filter((status) => statuses.delete(status));

  return [
    { id: "all", label: "All Courses" },
    ...ordered.map((status) => ({ id: status, label: status })),
    ...[...statuses].sort().map((status) => ({ id: status, label: status })),
  ];
}

function firstCourseValue(course, keys) {
  for (const key of keys) {
    const value = displayValue(course[key]);
    if (value !== "Not provided") return value;
  }
  return "Not provided";
}

function arrayField(course, keys) {
  for (const key of keys) {
    if (Array.isArray(course[key])) return course[key];
  }
  return [];
}

function safeMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const media = value.trim();
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(media)) {
    return media;
  }
  try {
    const url = new URL(media);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function getAiReport(course) {
  for (const key of ["aiReport", "aiReview", "qualityReport"]) {
    const value = course[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return AI_REPORT_FIELDS
        .filter(([field]) => Object.hasOwn(value, field))
        .map(([field, label]) => [label, displayValue(value[field])]);
    }

    if (typeof value === "string" && value.trim()) {
      return [["Report", value.trim()]];
    }
  }
  return [];
}

function readCourseSnapshot() {
  const users = readAdminArray(ADMIN_USERS_KEY);
  const teachers = getAdminTeachers(users);
  const teacherByEmail = new Map(
    teachers.map((teacher) => [
      teacher.email.trim().toLowerCase(),
      teacher,
    ]),
  );
  const courses = getAdminCourses(users);

  return courses.map((course) => {
    const email = course.teacherEmail.trim().toLowerCase();
    const teacher = teacherByEmail.get(email);
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
      ...course,
      teacherName:
        displayValue(teacher?.name) !== "Not provided"
          ? displayValue(teacher?.name)
          : displayValue(profile.name),
    };
  });
}

function courseKey(course) {
  const id =
    course.id === undefined || course.id === null || course.id === ""
      ? JSON.stringify({ ...course, teacherName: undefined })
      : String(course.id);

  return `${course.teacherEmail.trim().toLowerCase()}:${id}`;
}

function lessonText(lesson, key) {
  if (lesson === null || typeof lesson !== "object" || Array.isArray(lesson)) {
    return "Not provided";
  }

  return displayValue(lesson[key]);
}

function AdminCourseReview() {
  const [courses, setCourses] = useState(readCourseSnapshot);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionEditorOpen, setRevisionEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  const filters = useMemo(() => getCourseFilters(courses), [courses]);

  useEffect(() => {
    function refreshCourses() {
      setCourses(readCourseSnapshot());
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedCourse(null);
    }

    window.addEventListener("storage", refreshCourses);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshCourses);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("storage", refreshCourses);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshCourses);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      closeButtonRef.current?.focus();
    } else {
      returnFocusRef.current?.focus();
    }
  }, [selectedCourse]);

  function closeDetails() {
    setSelectedCourse(null);
    setRevisionEditorOpen(false);
    setRevisionNotes("");
  }

  function openDetails(course, event) {
    returnFocusRef.current = event.currentTarget;
    setRevisionNotes(
      typeof course.revisionNotes === "string" ? course.revisionNotes : "",
    );
    setRevisionEditorOpen(false);
    setMessage("");
    setError("");
    setSelectedCourse(course);
  }

  function handleDialogKeyDown(event) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), a[href], input:not(:disabled)',
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

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter;
      const searchableText = [
        course.title,
        course.teacherName,
        course.teacherEmail,
        course.category,
        course.subject,
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [courses, search, statusFilter]);

  function changeCourseStatus(course, nextStatus) {
    setMessage("");
    setError("");

    const confirmation =
      nextStatus === "Rejected"
        ? `Reject "${displayValue(course.title)}"? The course and its content will be preserved.`
        : nextStatus === "Suspended"
          ? `Suspend "${displayValue(course.title)}"? The course record and its content will be preserved.`
          : null;
    if (confirmation && !window.confirm(confirmation)) {
      return;
    }

    try {
      updateAdminCourseStatus(
        course.teacherEmail,
        course.id,
        nextStatus,
        nextStatus === "Changes Requested" ? { revisionNotes } : {},
      );
      const manager = window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";
      appendAdminActivityRecord({
        id: `course-${course.teacherEmail}-${course.id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: manager,
        action: nextStatus === "Approved"
          ? "approved"
          : nextStatus === "Rejected"
            ? "rejected"
            : nextStatus === "Suspended"
              ? "suspended"
              : "revision_requested",
        category: "course-review",
        entityType: "Course",
        entityId: String(course.id ?? "unknown"),
        targetId: String(course.id ?? "unknown"),
        targetName: displayValue(course.title),
        previousValue: course.status || "Not set",
        newValue: nextStatus,
        ...((nextStatus === "Rejected" || nextStatus === "Changes Requested") && revisionNotes.trim()
          ? { reason: revisionNotes.trim() }
          : {}),
        description:
          nextStatus === "Approved"
            ? "Course approved"
            : nextStatus === "Rejected"
              ? "Course rejected"
              : nextStatus === "Suspended"
                ? "Course suspended"
                : "Course revision requested",
        result: "Success",
      });
      const updatedSnapshot = readCourseSnapshot();
      setCourses(updatedSnapshot);
      closeDetails();
      setMessage(
        nextStatus === "Approved"
          ? "Course approved. It has not been published."
          : nextStatus === "Rejected"
            ? "Course rejected. The course and its content were preserved."
            : nextStatus === "Suspended"
              ? "Course suspended. No publishing or AI knowledge records were changed."
              : "Revision requested. The notes were saved with the course; no email was sent.",
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "The course status could not be updated.",
      );
    }
  }

  function renderFieldList(values, emptyMessage = "Not provided") {
    if (!values.length) {
      return (
        <p className="edc-admin-course-content-empty">{emptyMessage}</p>
      );
    }

    return (
      <ul className="edc-admin-course-review-list">
        {values.map((value, index) => {
          const label =
            value && typeof value === "object" && !Array.isArray(value)
              ? firstCourseValue(value, ["title", "name", "label"])
              : displayValue(value);
          const description =
            value && typeof value === "object" && !Array.isArray(value)
              ? firstCourseValue(value, ["description", "summary"])
              : "Not provided";
          return (
            <li key={`${label}-${index}`}>
              {label}
              {description !== "Not provided" ? ` — ${description}` : ""}
            </li>
          );
        })}
      </ul>
    );
  }

  function renderLessonContent(course) {
    if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
      return (
        <p className="edc-admin-course-content-empty">
          No course lessons or content are available.
        </p>
      );
    }

    return (
      <ol className="edc-admin-course-lessons">
        {course.lessons.map((lesson, index) => (
          <li key={lesson?.id ?? `${courseKey(course)}-lesson-${index}`}>
            <strong>{lessonText(lesson, "title")}</strong>
            {lessonText(lesson, "description") !== "Not provided" && (
              <span>{lessonText(lesson, "description")}</span>
            )}
          </li>
        ))}
      </ol>
    );
  }

  function renderDetails(course) {
    const price = displayValue(course.price);
    const currency = displayValue(course.currency);
    const fields = [
      ["Course title", displayValue(course.title)],
      ["Subtitle", displayValue(course.subtitle)],
      ["Instructor", displayValue(course.teacherName)],
      ["Teacher email", displayValue(course.teacherEmail)],
      ["Category or subject", displayValue(course.category ?? course.subject)],
      ["Pricing", price === "Not provided" ? price : `${price}${currency !== "Not provided" ? ` ${currency}` : ""}`],
      ["Submission date", formatSubmissionDate(course)],
      ["Current status", displayValue(course.status)],
    ];

    return fields.map(([label, value]) => (
      <div className="edc-admin-detail-field" key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ));
  }

  return (
    <section className="edc-admin-course-review">
      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">
            Search courses
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by course, teacher or subject"
          />
        </label>

        <div className="edc-admin-application-filters" aria-label="Filter courses">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                `edc-admin-filter-button${
                  statusFilter === filter.id
                    ? " edc-admin-filter-button-active"
                    : ""
                }`
              }
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="edc-admin-feedback edc-admin-feedback-success" role="status">
          <Check size={16} aria-hidden="true" />
          {message}
        </p>
      )}
      {error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <Info size={16} aria-hidden="true" />
          {error}
        </p>
      )}

      <p className="edc-admin-course-publishing-note">
        Course publishing is not supported in this demo. Approval does not publish
        a course or approve it for shared AI knowledge. AI governance remains a
        separate decision.
      </p>

      {courses.length === 0 ? (
        <div className="edc-admin-applications-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <BookOpen size={23} />
          </span>
          <h3>No courses found</h3>
          <p>Teacher courses stored in this browser will appear here.</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="edc-admin-applications-empty edc-admin-applications-empty-compact">
          <Search size={21} aria-hidden="true" />
          <h3>No matching courses</h3>
          <p>Try a different search term or status filter.</p>
        </div>
      ) : (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table edc-admin-course-table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Teacher</th>
                <th scope="col">Category</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">Review actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => {
                return (
                  <tr key={courseKey(course)}>
                    <td>
                      <strong>{displayValue(course.title)}</strong>
                    </td>
                    <td>
                      <strong>{displayValue(course.teacherName)}</strong>
                      <span>{displayValue(course.teacherEmail)}</span>
                    </td>
                    <td>{displayValue(course.category ?? course.subject)}</td>
                    <td>{formatSubmissionDate(course)}</td>
                    <td>
                      <span
                        className={`edc-admin-status-badge ${courseStatusClass(course.status)}`}
                      >
                        {displayValue(course.status)}
                      </span>
                    </td>
                    <td>
                      <div className="edc-admin-application-actions">
                        <button
                          className="edc-admin-action-button"
                          type="button"
                          onClick={(event) => openDetails(course, event)}
                        >
                          <Eye size={15} aria-hidden="true" />
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="edc-admin-applications-count" aria-live="polite">
        Showing {filteredCourses.length} of {courses.length} course
        {courses.length === 1 ? "" : "s"}
      </p>

      {selectedCourse && (
        <div
          className="edc-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            className="edc-admin-details-modal edc-admin-course-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edc-admin-course-details-title"
            onKeyDown={handleDialogKeyDown}
          >
            <header className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">COURSE REVIEW</span>
                <h3 id="edc-admin-course-details-title">
                  {displayValue(selectedCourse.title)}
                </h3>
              </div>
              <button
                className="edc-admin-modal-close"
                type="button"
                aria-label="Close course details"
                ref={closeButtonRef}
                onClick={closeDetails}
              >
                <X size={19} />
              </button>
            </header>
            <div className="edc-admin-course-review-panels">
              <div className="edc-admin-course-preview">
                <h4>Course preview</h4>
                <dl className="edc-admin-details-list">
                  {renderDetails(selectedCourse)}
                  <div className="edc-admin-detail-field">
                    <dt>Description</dt>
                    <dd>{displayValue(selectedCourse.description)}</dd>
                  </div>
                  <div className="edc-admin-detail-field">
                    <dt>Target audience</dt>
                    <dd>{firstCourseValue(selectedCourse, ["targetAudience", "audience"])}</dd>
                  </div>
                  <div className="edc-admin-detail-field">
                    <dt>Refund policy</dt>
                    <dd>{firstCourseValue(selectedCourse, ["refundPolicy", "refundTerms"])}</dd>
                  </div>
                </dl>

                <section className="edc-admin-course-section">
                  <h5>Syllabus</h5>
                  {Array.isArray(selectedCourse.syllabus)
                    ? renderFieldList(selectedCourse.syllabus)
                    : <p>{displayValue(selectedCourse.syllabus)}</p>}
                </section>
                <section className="edc-admin-course-section">
                  <h5>Sections</h5>
                  {renderFieldList(arrayField(selectedCourse, ["sections"]))}
                </section>
                <section className="edc-admin-course-section">
                  <h5>Learning outcomes</h5>
                  {renderFieldList(arrayField(selectedCourse, ["learningOutcomes", "outcomes"]))}
                </section>
                <section className="edc-admin-course-section edc-admin-course-content">
                  <h5>Lessons</h5>
                  {renderLessonContent(selectedCourse)}
                </section>
                <section className="edc-admin-course-section">
                  <h5>Media</h5>
                  {(() => {
                    const media = firstCourseValue(selectedCourse, [
                      "thumbnailUrl",
                      "thumbnail",
                      "imageUrl",
                      "image",
                      "videoUrl",
                    ]);
                    const mediaUrl = safeMediaUrl(media);
                    if (!mediaUrl) {
                      return <p className="edc-admin-course-content-empty">No supported course media is available.</p>;
                    }
                    const isImage =
                      /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(mediaUrl) ||
                      /\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(mediaUrl);
                    return (
                      <div className="edc-admin-course-media">
                        {isImage && (
                          <img
                            src={mediaUrl}
                            alt={`${displayValue(selectedCourse.title)} course media`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={14} aria-hidden="true" />
                          Open course media in a new tab
                        </a>
                      </div>
                    );
                  })()}
                </section>
              </div>

              <aside className="edc-admin-course-decision">
                <h4>Admin decision</h4>
                <span className={`edc-admin-status-badge ${courseStatusClass(selectedCourse.status)}`}>
                  {displayValue(selectedCourse.status)}
                </span>
                <dl className="edc-admin-details-list">{renderDetails(selectedCourse).filter((_, index) => index === 5 || index === 6)}</dl>

                <div className="edc-admin-course-ai-report">
                  <strong>AI quality report</strong>
                  {getAiReport(selectedCourse).length ? (
                    <dl className="edc-admin-details-list">
                      {getAiReport(selectedCourse).map(([label, value]) => (
                        <div className="edc-admin-detail-field" key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p>AI report pending / not available.</p>
                  )}
                </div>

                <div className="edc-admin-course-rights">
                  <strong>Rights declaration</strong>
                  <p>{firstCourseValue(selectedCourse, ["rightsDeclaration", "ownershipDeclaration", "contentOwnership"])}</p>
                  <p>
                    Status: {firstCourseValue(selectedCourse, ["rightsStatus", "ownershipStatus"])}
                  </p>
                </div>

                {typeof selectedCourse.revisionNotes === "string" &&
                  selectedCourse.revisionNotes.trim() && (
                    <div className="edc-admin-course-revision-note">
                      <strong>Saved revision notes</strong>
                      <p>{selectedCourse.revisionNotes}</p>
                    </div>
                  )}

                <div className="edc-admin-course-review-checklist">
                  <strong>Manual review checklist</strong>
                  {[
                    "Course information is complete.",
                    "Syllabus and lessons have been reviewed.",
                    "Course content is appropriate.",
                    "Ownership declaration has been checked.",
                    "Potential safety concerns have been considered.",
                  ].map((item) => (
                    <label key={item}>
                      <input type="checkbox" />
                      {item}
                    </label>
                  ))}
                  <span className="edc-admin-course-checklist-note">
                    Checklist selections are temporary and do not represent automated verification.
                  </span>
                </div>

                {selectedCourse.status === "Pending Approval" && (
                  <div className="edc-admin-details-actions">
                    <button
                      className="edc-admin-action-button edc-admin-action-approve"
                      type="button"
                      onClick={() => changeCourseStatus(selectedCourse, "Approved")}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      className="edc-admin-action-button edc-admin-action-reject"
                      type="button"
                      onClick={() => changeCourseStatus(selectedCourse, "Rejected")}
                    >
                      <XCircle size={15} aria-hidden="true" />
                      Reject
                    </button>
                    <button
                      className="edc-admin-action-button"
                      type="button"
                      onClick={() => setRevisionEditorOpen((open) => !open)}
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      Request Revision
                    </button>
                  </div>
                )}

                {revisionEditorOpen &&
                  selectedCourse.status === "Pending Approval" && (
                    <form
                      className="edc-admin-course-revision-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!revisionNotes.trim()) {
                          setError("Enter revision notes before requesting changes.");
                          return;
                        }
                        changeCourseStatus(selectedCourse, "Changes Requested");
                      }}
                    >
                      <label htmlFor="edc-admin-revision-notes">
                        Revision notes for the teacher
                      </label>
                      <textarea
                        id="edc-admin-revision-notes"
                        required
                        value={revisionNotes}
                        onChange={(event) => setRevisionNotes(event.target.value)}
                        placeholder="Describe the changes needed."
                      />
                      <button
                        className="edc-admin-action-button"
                        type="submit"
                      >
                        Save revision notes
                      </button>
                      <span className="edc-admin-course-checklist-note">
                        Notes are saved with the course. No email or notification is sent.
                      </span>
                    </form>
                  )}

                {["Approved", "Published"].includes(selectedCourse.status) && (
                  <div className="edc-admin-details-actions">
                    <button
                      className="edc-admin-action-button edc-admin-action-reject"
                      type="button"
                      onClick={() => changeCourseStatus(selectedCourse, "Suspended")}
                    >
                      <Ban size={15} aria-hidden="true" />
                      Suspend course
                    </button>
                  </div>
                )}
                <p className="edc-admin-course-unsupported-note">
                  Publishing and shared AI knowledge approval are not available in this demo.
                </p>
              </aside>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminCourseReview;
