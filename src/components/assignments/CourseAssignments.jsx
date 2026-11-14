import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { notifyEnrolledStudents } from "../../utils/demoNotifications";
import { collectInstructorCourseAnalytics } from "../../utils/instructorAnalytics";
import {
  ASSIGNMENT_EVENT,
  assignmentKey,
  submissionKey,
  norm,
  read,
  save,
  uid,
  allSubmissions,
  getAttachment,
  downloadFile,
} from "./assignmentStorage";
import "./CourseAssignments.css";
import "./CourseAssignmentsTeacher.css";
import StudentCourseAssignments from "./StudentCourseAssignments";

const blankAssignment = () => ({
  id: uid(),
  title: "",
  instructions: "",
  dueAt: "",
  maxMarks: 100,
  published: false,
  createdAt: new Date().toISOString(),
});
const identity = (courseId, assignmentId) => `${String(courseId)}::${String(assignmentId)}`;
const graded = (submission) =>
  Boolean(submission.gradedAt) &&
  submission.marks !== null &&
  submission.marks !== undefined &&
  String(submission.marks).trim() !== "";
const scorePercent = (submission) => {
  if (!graded(submission)) return null;
  const marks = Number(submission.marks);
  const maxMarks = Number(submission.maxMarks);
  return Number.isFinite(marks) &&
    Number.isFinite(maxMarks) &&
    maxMarks > 0 &&
    marks >= 0 &&
    marks <= maxMarks
    ? marks / maxMarks * 100
    : null;
};
const formatDate = (value, includeTime = false) => {
  const timestamp = Date.parse(value || "");
  if (!value) return includeTime ? "Date not recorded" : "No deadline";
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "Date not recorded";
};
const formatMonthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const formatMonth = (date) =>
  date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
const formatPercent = (value) =>
  Number.isFinite(value) ? `${Math.round(value)}%` : "—";

function useAssignmentChanges() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener(ASSIGNMENT_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(ASSIGNMENT_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return version;
}

function getMonths(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1),
    );
    return { key: formatMonthKey(date), label: formatMonth(date) };
  });
}

function SubmissionTrend({ months, submissions }) {
  const values = months.map(({ key }) =>
    submissions.filter((submission) => String(submission.submittedAt || "").slice(0, 7) === key).length,
  );
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => ({
    x: 48 + (index * 552) / Math.max(1, values.length - 1),
    y: 170 - (value / max) * 130,
  }));
  const line = points
    .map(({ x, y }, index) => `${index ? "L" : "M"}${x},${y}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1]?.x || 600},180 L${points[0]?.x || 48},180 Z`;

  return (
    <div className="edca-t-chart">
      <svg viewBox="0 0 640 215" role="img" aria-label="Saved assignment submissions by month">
        <defs>
          <linearGradient id="edca-submission-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7412c7" stopOpacity=".24" />
            <stop offset="100%" stopColor="#7412c7" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[40, 75, 110, 145, 180].map((y) => (
          <line key={y} x1="48" x2="600" y1={y} y2={y} className="edca-t-gridline" />
        ))}
        {points.length > 1 && <path d={area} fill="url(#edca-submission-area)" />}
        {points.length > 1 && <path d={line} className="edca-t-trend-line" />}
        {points.map(({ x, y }, index) => (
          <g key={months[index].key}>
            <circle cx={x} cy={y} r="4.5" className="edca-t-trend-dot">
              <title>{`${months[index].label}: ${values[index]} submissions`}</title>
            </circle>
            <text x={x} y="207" textAnchor="middle" className="edca-t-month-label">
              {months[index].label}
            </text>
          </g>
        ))}
      </svg>
      {!values.some((value) => value > 0) && (
        <p className="edca-t-chart-empty">No dated submissions in this period.</p>
      )}
    </div>
  );
}

function Teacher({ email, courses }) {
  const version = useAssignmentChanges();
  const [courseId, setCourseId] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissionFilter, setSubmissionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(6);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const selected = courses.find((course) => String(course.id) === String(courseId)) || courses[0];
  const selectedCourseId = selected?.id;

  const assignments = useMemo(() => {
    void version;
    return selectedCourseId === undefined || selectedCourseId === null
      ? []
      : read(assignmentKey(email, selectedCourseId));
  }, [email, selectedCourseId, version]);
  const assignmentRows = useMemo(() => {
    void version;
    return courses.flatMap((course) =>
      read(assignmentKey(email, course.id))
        .filter((assignment) => assignment && typeof assignment === "object")
        .map((assignment) => ({
          ...assignment,
          courseId: course.id,
          courseTitle: course.title || "Untitled course",
          teacherEmail: email,
        })),
    );
  }, [courses, email, version]);
  const allSubmissionRecords = useMemo(() => {
    void version;
    return allSubmissions();
  }, [version]);
  const courseAnalytics = useMemo(() => {
    void version;
    return collectInstructorCourseAnalytics(email, courses);
  }, [email, courses, version]);
  const assignmentMap = new Map(
    assignmentRows.map((assignment) => [
      identity(assignment.courseId, assignment.id),
      assignment,
    ]),
  );
  const enrollmentCountByCourse = new Map(
    courseAnalytics.map((course) => [String(course.id), course.students]),
  );
  const submissions = allSubmissionRecords
    .filter((submission) =>
      submission &&
      norm(submission.teacherEmail) === norm(email) &&
      assignmentMap.has(identity(submission.courseId, submission.assignmentId)),
    )
    .map((submission) => {
      const assignment = assignmentMap.get(identity(submission.courseId, submission.assignmentId));
      return {
        ...submission,
        assignmentTitle: assignment.title || submission.assignmentTitle || "Untitled assignment",
        courseTitle: assignment.courseTitle,
        maxMarks: submission.maxMarks ?? assignment.maxMarks,
      };
    })
    .sort(
      (left, right) =>
        (Date.parse(right.submittedAt || "") || 0) -
        (Date.parse(left.submittedAt || "") || 0),
    );
  const rows = assignmentRows.map((assignment) => {
    const assignmentSubmissions = submissions.filter(
      (submission) => identity(submission.courseId, submission.assignmentId) === identity(assignment.courseId, assignment.id),
    );
    const scores = assignmentSubmissions.map(scorePercent).filter((value) => value !== null);
    return {
      ...assignment,
      submissions: assignmentSubmissions,
      rosterCount: enrollmentCountByCourse.get(String(assignment.courseId)) || 0,
      average: scores.length
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : null,
    };
  });
  const filteredRows = rows.filter((assignment) => {
    if (courseFilter !== "all" && String(assignment.courseId) !== courseFilter) return false;
    if (statusFilter === "published" && !assignment.published) return false;
    if (statusFilter === "draft" && assignment.published) return false;
    return `${assignment.title || ""} ${assignment.courseTitle || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });
  const gradedSubmissions = submissions.filter(graded);
  const validGradedSubmissions = gradedSubmissions.filter((submission) => scorePercent(submission) !== null);
  const pendingSubmissions = submissions.filter((submission) => !graded(submission));
  const selectedSubmission = submissions.find((submission) => submission.id === selectedId);
  const selectedAssignment = rows.find(
    (assignment) => identity(assignment.courseId, assignment.id) === selectedAssignmentId,
  );
  const selectedAssignmentSubmissions = selectedAssignment?.submissions || [];
  const visibleSubmissions = submissions.filter((submission) =>
    submissionFilter === "all" ||
    (submissionFilter === "graded" ? graded(submission) : !graded(submission)),
  );
  const recentSubmissions = showAllSubmissions
    ? visibleSubmissions
    : visibleSubmissions.slice(0, 5);
  const totalSubmissions = submissions.length;
  const assignmentsPublished = rows.filter((assignment) => assignment.published).length;
  const averageGrade = validGradedSubmissions.length
    ? validGradedSubmissions.reduce((total, submission) => total + scorePercent(submission), 0) / validGradedSubmissions.length
    : null;
  const months = getMonths(period);
  const courseGrades = courses.map((course) => {
    const gradedCourseSubmissions = validGradedSubmissions.filter(
      (submission) => String(submission.courseId) === String(course.id),
    );
    const average = gradedCourseSubmissions.length
      ? gradedCourseSubmissions.reduce((total, submission) => total + scorePercent(submission), 0) / gradedCourseSubmissions.length
      : null;
    return {
      id: String(course.id),
      title: course.title || "Untitled course",
      average,
      gradedCount: gradedCourseSubmissions.length,
    };
  });
  const scoreValues = validGradedSubmissions
    .map(scorePercent)
    .filter((score) => score !== null);

  const persistAssignment = () => {
    if (!selected) {
      setMessage("Select a course before saving an assignment.");
      return;
    }
    const title = editing.title.trim();
    const instructions = editing.instructions.trim();
    const maxMarks = Number(editing.maxMarks);
    if (!title || !instructions || !Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 10000) {
      setMessage("Title, instructions and valid maximum marks (1–10000) are required.");
      return;
    }
    if (editing.dueAt && !Number.isFinite(Date.parse(editing.dueAt))) {
      setMessage("Enter a valid deadline.");
      return;
    }
    const previous = assignments.find((assignment) => assignment.id === editing.id);
    const justPublished = Boolean(editing.published && !previous?.published);
    const item = {
      ...editing,
      title,
      instructions,
      maxMarks,
      teacherEmail: email,
      courseId: selected.id,
      updatedAt: new Date().toISOString(),
      publishedAt: justPublished ? new Date().toISOString() : previous?.publishedAt,
    };
    save(
      assignmentKey(email, selected.id),
      previous
        ? assignments.map((assignment) => assignment.id === item.id ? item : assignment)
        : [...assignments, item],
    );
    if (justPublished) {
      notifyEnrolledStudents(email, selected.id, {
        id: `assignment-published:${item.id}:${item.publishedAt}`,
        type: "assignment",
        title: "New assignment available",
        message: `${item.title} is now available in ${selected.title || "your course"}.`,
        link: "course-assignments",
      });
    }
    setEditing(null);
    setMessage("Assignment saved.");
  };

  const startEditing = (assignment) => {
    setCourseId(String(assignment.courseId));
    setEditing({ ...assignment });
    setMessage("");
  };

  const togglePublish = (assignment) => {
    const publishing = !assignment.published;
    const updated = {
      ...assignment,
      published: publishing,
      publishedAt: publishing ? new Date().toISOString() : assignment.publishedAt,
    };
    const key = assignmentKey(email, assignment.courseId);
    save(key, read(key).map((item) => item.id === assignment.id ? updated : item));
    if (publishing) {
      notifyEnrolledStudents(email, assignment.courseId, {
        id: `assignment-published:${updated.id}:${updated.publishedAt}`,
        type: "assignment",
        title: "New assignment available",
        message: `${updated.title} is now available in ${assignment.courseTitle || "your course"}.`,
        link: "course-assignments",
      });
    }
  };

  const remove = (assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"? Past submissions will be retained.`)) return;
    const key = assignmentKey(email, assignment.courseId);
    save(key, read(key).filter((item) => item.id !== assignment.id));
    if (selectedAssignmentId === identity(assignment.courseId, assignment.id)) {
      setSelectedAssignmentId("");
    }
    setMessage("Assignment deleted.");
  };

  const startGrading = (submission) => {
    setSelectedId(submission.id);
    setMarks(submission.marks ?? "");
    setFeedback(submission.feedback || "");
    setMessage("");
  };

  const grade = () => {
    if (!selectedSubmission) {
      setMessage("Select a saved submission to grade.");
      return;
    }
    const assignment = assignmentMap.get(
      identity(selectedSubmission.courseId, selectedSubmission.assignmentId),
    );
    if (!assignment) {
      setMessage("The assignment for this submission could not be found.");
      return;
    }
    const score = Number(marks);
    if (marks === "" || !Number.isFinite(score) || score < 0 || score > Number(assignment.maxMarks)) {
      setMessage(`Marks must be between 0 and ${assignment.maxMarks}.`);
      return;
    }
    const key = submissionKey(selectedSubmission.studentEmail, selectedSubmission.assignmentId);
    const stored = read(key);
    if (!stored.some((submission) => submission.id === selectedSubmission.id)) {
      setMessage("This submission is no longer available.");
      return;
    }
    save(
      key,
      stored.map((submission) => submission.id === selectedSubmission.id
        ? { ...submission, marks: score, feedback: feedback.trim(), gradedAt: new Date().toISOString(), gradedBy: email }
        : submission),
    );
    setSelectedId("");
    setMarks("");
    setFeedback("");
    setMessage("Grade and feedback saved.");
  };

  const showSubmissionFilter = (filter) => {
    setSubmissionFilter(filter);
    setShowAllSubmissions(true);
  };

  const getFile = async (submission) => {
    if (!submission.fileId) return;
    try {
      const file = await getAttachment(submission.fileId);
      if (!file) throw new Error("Attachment not found in this browser.");
      downloadFile(file);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open attachment.");
    }
  };

  const openAssignment = (assignment) => {
    setSelectedAssignmentId(identity(assignment.courseId, assignment.id));
    setSelectedId("");
  };

  return (
    <main className="edca-root edca-teacher-dashboard">
      <header className="edca-t-header">
        <div>
          <span>TEACHER WORKSPACE</span>
          <h1><ClipboardList size={26} /> Course Assignments</h1>
          <p>Create, manage, and grade assignments from your saved student submissions.</p>
        </div>
        <button
          type="button"
          className="edca-t-create"
          disabled={!selected}
          onClick={() => {
            setEditing(blankAssignment());
            setMessage("");
          }}
        >
          <Plus size={18} /> Create New Assignment
        </button>
      </header>

      <p className="edca-t-notice">
        <CircleAlert size={16} />
        Browser-local records only. Counts and grades come from saved assignments and submissions; no sample activity or real backend sync is added.
      </p>

      <section className="edca-t-stats" aria-label="Assignment summary">
        <button type="button" className="purple" onClick={() => { setStatusFilter("all"); setCourseFilter("all"); setSearch(""); }}>
          <span><ClipboardList size={22} /></span><small>Total Assignments</small><strong>{rows.length}</strong>
        </button>
        <button type="button" className="gold" onClick={() => showSubmissionFilter("all")}>
          <span><UsersRound size={22} /></span><small>Total Submissions</small><strong>{totalSubmissions}</strong>
        </button>
        <button type="button" className="purple" onClick={() => showSubmissionFilter("graded")}>
          <span><CheckCircle2 size={22} /></span><small>Graded</small><strong>{gradedSubmissions.length}</strong>
        </button>
        <button type="button" className="gold" onClick={() => showSubmissionFilter("pending")}>
          <span><Clock3 size={22} /></span><small>Pending Review</small><strong>{pendingSubmissions.length}</strong>
        </button>
      </section>

      {message && <p className="edca-message" role="status">{message}</p>}

      {editing && selected && (
        <section className="edca-panel edca-t-editor">
          <header>
            <div><h2>{assignments.some((assignment) => assignment.id === editing.id) ? "Edit Assignment" : "New Assignment"}</h2><p>Only saved assignment details will appear to students.</p></div>
            <button type="button" aria-label="Close assignment editor" onClick={() => setEditing(null)}><X size={18} /></button>
          </header>
          <label className="edca-label">Course
            <select value={String(selected.id)} onChange={(event) => { setCourseId(event.target.value); setEditing(null); }}>
              {courses.map((course) => <option key={String(course.id)} value={String(course.id)}>{course.title || "Untitled course"}</option>)}
            </select>
          </label>
          <label className="edca-label">Title
            <input value={editing.title} maxLength={140} onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="edca-label">Instructions
            <textarea rows="5" value={editing.instructions} onChange={(event) => setEditing((current) => ({ ...current, instructions: event.target.value }))} />
          </label>
          <div className="edca-grid">
            <label className="edca-label">Due date (optional)
              <input type="datetime-local" value={editing.dueAt || ""} onChange={(event) => setEditing((current) => ({ ...current, dueAt: event.target.value }))} />
            </label>
            <label className="edca-label">Maximum marks
              <input type="number" min="1" max="10000" value={editing.maxMarks} onChange={(event) => setEditing((current) => ({ ...current, maxMarks: event.target.value }))} />
            </label>
          </div>
          <label className="edca-check">
            <input type="checkbox" checked={editing.published} onChange={(event) => setEditing((current) => ({ ...current, published: event.target.checked }))} />
            Published for enrolled students
          </label>
          <div className="edca-actions">
            <button type="button" className="edca-primary" onClick={persistAssignment}>Save Assignment</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </section>
      )}

      <div className="edca-t-toolbar">
        <div className="edca-t-status-tabs" aria-label="Filter assignments by status">
          {[
            ["all", "All Assignments", rows.length],
            ["published", "Published", assignmentsPublished],
            ["draft", "Draft", rows.length - assignmentsPublished],
          ].map(([value, label, count]) => (
            <button type="button" key={value} className={statusFilter === value ? "active" : ""} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>
              {label} <span>({count})</span>
            </button>
          ))}
        </div>
        <label className="edca-t-course-filter">
          <BookOpen size={16} />
          <select aria-label="Filter assignments by course" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
            <option value="all">All Courses</option>
            {courses.map((course) => <option key={String(course.id)} value={String(course.id)}>{course.title || "Untitled course"}</option>)}
          </select>
        </label>
        <label className="edca-t-search">
          <Search size={16} />
          <input type="search" aria-label="Search assignments" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments..." />
        </label>
      </div>

      <div className="edca-t-main-grid">
        <section className="edca-panel edca-t-list-panel">
          <header className="edca-t-panel-heading">
            <div><h2>Assignments</h2><p>Saved assignments across your courses</p></div>
            <span>{filteredRows.length} shown</span>
          </header>
          <div className="edca-t-table-wrap">
            <table className="edca-t-table">
              <thead><tr><th>#</th><th>Assignment Title</th><th>Course</th><th>Due Date</th><th>Submissions</th><th>Avg. Score</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredRows.map((assignment, index) => (
                  <tr key={identity(assignment.courseId, assignment.id)}>
                    <td>{index + 1}</td>
                    <td><strong>{assignment.title || "Untitled assignment"}</strong></td>
                    <td>{assignment.courseTitle}</td>
                    <td><span className="edca-t-due"><CalendarDays size={13} />{formatDate(assignment.dueAt)}</span></td>
                    <td>{assignment.submissions.length}</td>
                    <td>{formatPercent(assignment.average)}</td>
                    <td><span className={`edca-t-status ${assignment.published ? "published" : "draft"}`}>{assignment.published ? "Published" : "Draft"}</span></td>
                    <td>
                      <div className="edca-t-row-actions">
                        <button type="button" title="View submissions" aria-label={`View ${assignment.title} submissions`} onClick={() => openAssignment(assignment)}><Eye size={15} /></button>
                        <button type="button" title="Edit assignment" aria-label={`Edit ${assignment.title}`} onClick={() => startEditing(assignment)}><Edit3 size={15} /></button>
                        <button type="button" title={assignment.published ? "Unpublish assignment" : "Publish assignment"} aria-label={`${assignment.published ? "Unpublish" : "Publish"} ${assignment.title}`} onClick={() => togglePublish(assignment)}>{assignment.published ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}</button>
                        <button type="button" title="Delete assignment" aria-label={`Delete ${assignment.title}`} onClick={() => remove(assignment)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr><td colSpan={8} className="edca-t-empty-cell">
                    {rows.length
                      ? "No assignments match these filters."
                      : courses.length
                        ? "No assignments have been created yet."
                        : "Create a course before adding assignments."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="edca-t-side">
          <section className="edca-panel">
            <header className="edca-t-panel-heading"><h2><ClipboardList size={17} /> Submission Status</h2></header>
            <div className="edca-t-status-content">
              <div className={`edca-t-status-donut${totalSubmissions ? "" : " empty"}`} style={totalSubmissions ? { background: `conic-gradient(#31b85a 0 ${gradedSubmissions.length / totalSubmissions * 100}%, #951dd3 ${gradedSubmissions.length / totalSubmissions * 100}% 100%)` } : undefined}>
                <div><strong>{totalSubmissions}</strong><small>Submissions</small></div>
              </div>
              <ul>
                <li><i className="graded" /><span>Graded</span><strong>{gradedSubmissions.length}</strong></li>
                <li><i className="pending" /><span>Pending review</span><strong>{pendingSubmissions.length}</strong></li>
              </ul>
            </div>
            {!totalSubmissions && <p className="edca-t-empty">No submissions are saved yet.</p>}
          </section>

          <section className="edca-panel">
            <header className="edca-t-panel-heading"><div><h2><BarChart3 size={17} /> Grade Distribution</h2><p>Saved graded submissions by percentage</p></div></header>
            <div className="edca-t-grade-bars">
              {[
                ["90–100%", (score) => score >= 90],
                ["80–89%", (score) => score >= 80 && score < 90],
                ["70–79%", (score) => score >= 70 && score < 80],
                ["Below 70%", (score) => score < 70],
              ].map(([label, matches]) => {
                const count = scoreValues.filter(matches).length;
                const width = scoreValues.length ? count / scoreValues.length * 100 : 0;
                return (
                  <div key={label}>
                    <span>{label}</span>
                    <div><i style={{ width: `${width}%` }} /></div>
                    <strong>{scoreValues.length ? `${count} (${Math.round(width)}%)` : "—"}</strong>
                  </div>
                );
              })}
            </div>
            {!scoreValues.length && <p className="edca-t-empty">No saved grades to group yet.</p>}
          </section>
        </aside>
      </div>

      {selectedAssignment && (
        <section className="edca-panel edca-t-selected-assignment">
          <header className="edca-t-panel-heading">
            <div><h2>{selectedAssignment.title || "Untitled assignment"}</h2><p>{selectedAssignment.courseTitle} · {selectedAssignmentSubmissions.length} saved submissions</p></div>
            <button type="button" aria-label="Close assignment submissions" onClick={() => setSelectedAssignmentId("")}><X size={18} /></button>
          </header>
          {selectedAssignmentSubmissions.length ? (
            <div className="edca-t-submission-list">
              {selectedAssignmentSubmissions.map((submission) => (
                <article key={submission.id}>
                  <div className="edca-t-submission-copy">
                    <strong>{submission.studentEmail || "Student email not recorded"}</strong>
                    <small>{formatDate(submission.submittedAt, true)}{submission.late ? " · Late" : ""}</small>
                    {submission.answer && <p>{submission.answer}</p>}
                    {submission.fileId && <button type="button" className="edca-t-file" onClick={() => getFile(submission)}><Download size={14} />{submission.fileName || "Download attachment"}</button>}
                    <span className={`edca-t-grade-status ${graded(submission) ? "graded" : "pending"}`}>
                      {graded(submission)
                        ? `Graded ${submission.marks} / ${submission.maxMarks} marks`
                        : "Pending review"}
                    </span>
                  </div>
                  <button type="button" className="edca-t-grade-button" onClick={() => startGrading(submission)}>
                    {graded(submission) ? "Update Grade" : "Grade"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="edca-t-empty">No submissions have been saved for this assignment.</p>
          )}
        </section>
      )}

      {selectedSubmission && (
        <section className="edca-panel edca-t-grade-editor">
          <header className="edca-t-panel-heading">
            <div><h2>Grade Submission</h2><p>{selectedSubmission.studentEmail} · {selectedSubmission.assignmentTitle}</p></div>
            <button type="button" aria-label="Close grade form" onClick={() => setSelectedId("")}><X size={18} /></button>
          </header>
          <label className="edca-label">Marks
            <input type="number" min="0" max={selectedSubmission.maxMarks} value={marks} onChange={(event) => setMarks(event.target.value)} />
          </label>
          <label className="edca-label">Feedback
            <textarea rows="4" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </label>
          <div className="edca-actions">
            <button type="button" className="edca-primary" onClick={grade}>Save Grade</button>
            <button type="button" onClick={() => setSelectedId("")}>Cancel</button>
          </div>
        </section>
      )}

      <div className="edca-t-bottom-grid">
        <section className="edca-panel">
          <header className="edca-t-panel-heading">
            <div><h2><BarChart3 size={17} /> Submission Trend</h2><p>Saved submissions by date</p></div>
            <label className="edca-t-period"><CalendarDays size={14} /><select aria-label="Submission trend period" value={period} onChange={(event) => setPeriod(Number(event.target.value))}><option value={6}>Last 6 Months</option><option value={12}>Last 12 Months</option></select></label>
          </header>
          <SubmissionTrend months={months} submissions={submissions} />
        </section>

        <section className="edca-panel">
          <header className="edca-t-panel-heading"><div><h2><CheckCircle2 size={17} /> Average Score by Course</h2><p>From saved graded submissions</p></div></header>
          {courseGrades.length ? (
            <ul className="edca-t-course-grades">
              {courseGrades.map((course) => (
                <li key={course.id}>
                  <div><strong>{course.title}</strong><small>{course.gradedCount} graded submissions</small></div>
                  {course.average === null
                    ? <span>—</span>
                    : <><b>{formatPercent(course.average)}</b><i><em style={{ width: `${Math.min(100, course.average)}%` }} /></i></>}
                </li>
              ))}
            </ul>
          ) : <p className="edca-t-empty">No saved courses are available.</p>}
          {averageGrade !== null && <small className="edca-t-overall-score">Overall average: {formatPercent(averageGrade)} across {gradedSubmissions.length} graded submissions.</small>}
        </section>

        <section className="edca-panel edca-t-recent">
          <header className="edca-t-panel-heading">
            <div><h2><UsersRound size={17} /> Recent Submissions</h2><p>{visibleSubmissions.length} matching saved submissions</p></div>
            <button type="button" onClick={() => setShowAllSubmissions((value) => !value)} disabled={visibleSubmissions.length <= 5}>
              {showAllSubmissions ? "Show Less" : "View All"}
            </button>
          </header>
          {recentSubmissions.length ? (
            <ul>
              {recentSubmissions.map((submission) => (
                <li key={submission.id}>
                  <span className="edca-t-avatar">{String(submission.studentEmail || "?").slice(0, 1).toUpperCase()}</span>
                  <div><strong>{submission.studentEmail || "Student email not recorded"}</strong><small>{submission.assignmentTitle} · {submission.courseTitle}</small><small>{formatDate(submission.submittedAt, true)}</small></div>
                  <b className={graded(submission) ? "graded" : "pending"}>{graded(submission) ? formatPercent(scorePercent(submission)) : "Pending"}</b>
                  <button type="button" className="edca-t-mini-grade" onClick={() => startGrading(submission)}>{graded(submission) ? "Edit" : "Grade"}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="edca-t-empty">{submissionFilter === "graded" ? "No graded submissions are available." : submissionFilter === "pending" ? "No submissions are waiting for review." : "No assignment submissions have been saved yet."}</p>
          )}
        </section>
      </div>

      <p className="edca-note">
        Assignments and submissions are stored in this browser. Average scores use saved grades only; no scheduled assignments, sample students, or invented activity are shown.
      </p>
    </main>
  );
}

export default function CourseAssignments({ role, email, courses = [], ...props }) {
  return role === "teacher"
    ? <Teacher email={email} courses={courses} />
    : <StudentCourseAssignments key={email} email={email} courses={courses} {...props} />;
}
