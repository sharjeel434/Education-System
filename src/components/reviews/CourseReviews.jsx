import { useEffect, useMemo, useState } from "react";
import { courseReviewKey, getReviews, REVIEW_EVENT } from "../../utils/courseReviews";
import ReportAction from "../moderation/ReportAction";
import StudentCourseReviews from "./StudentCourseReviews";

const shell = { background: "white", padding: 22, borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 16 };

function TeacherCourseReviews({ email, courses = [] }) {
  const [reviews, setReviews] = useState(() => getReviews());
  useEffect(() => {
    const refresh = () => setReviews(getReviews());
    [REVIEW_EVENT, "storage", "focus"].forEach(event => window.addEventListener(event, refresh));
    return () => [REVIEW_EVENT, "storage", "focus"].forEach(event => window.removeEventListener(event, refresh));
  }, []);
  const list = useMemo(() => courses.map(course => {
    const identified = { ...course, teacherEmail: course.teacherEmail || email };
    return { ...identified, reviewKey: courseReviewKey(identified) };
  }), [courses, email]);
  return <section style={{ padding: "12px 0" }}>
    <h2 style={{ marginBottom: 8 }}>Course Reviews &amp; Ratings</h2>
    <p style={{ color: "#6b7280", marginBottom: 20 }}>View student feedback and average course ratings.</p>
    {!list.length ? <div style={shell}>No courses available yet.</div> : list.map(course => {
      const items = reviews.filter(review => review.courseKey === course.reviewKey);
      const average = items.length ? (items.reduce((sum, review) => sum + Number(review.rating), 0) / items.length).toFixed(1) : null;
      return <article style={shell} key={course.reviewKey}>
        <h3 style={{ marginTop: 0 }}>{course.title}</h3>
        <p style={{ color: "#6d28d9", fontWeight: 600 }}>{average ? `★ ${average}/5 · ${items.length} review(s)` : "No ratings yet"}</p>
        {items.length === 0 ? <p style={{ color: "#6b7280" }}>No reviews yet.</p> : items.map(review => <div key={review.id || review.studentEmail} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
          <strong>{review.studentName || review.studentEmail || "Student"}</strong>
          <span style={{ marginLeft: 12, color: "#d97706" }}>{"★".repeat(Math.min(5, Math.max(1, Number(review.rating))))} ({review.rating}/5)</span>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBottom: 4 }}>{review.comment}</p>
          <small style={{ color: "#6b7280" }}>{new Date(review.updatedAt).toLocaleDateString()}</small>
          <ReportAction reporterEmail={email} reporterName={email} reporterRole="Teacher" target={{ reportType: "content", targetType: "review", targetId: String(review.id || `${review.courseKey}:${review.studentEmail}`), targetTitle: `Review for ${course.title}`, targetOwnerEmail: course.teacherEmail, targetRole: "Teacher" }}/>
        </div>)}
      </article>;
    })}
    <p style={{ fontSize: 12, color: "#6b7280" }}>Demo reviews are saved in this browser.</p>
  </section>;
}

export default function CourseReviews({ role, ...props }) {
  return role === "student" ? <StudentCourseReviews {...props}/> : <TeacherCourseReviews {...props}/>;
}
