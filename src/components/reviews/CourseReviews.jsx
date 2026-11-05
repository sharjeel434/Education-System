import { useEffect, useMemo, useState } from "react";
import { courseReviewKey, getReviews, removeReview, REVIEW_EVENT, saveReview } from "../../utils/courseReviews";

const shell = { background: "white", padding: 22, borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 16 };
const btn = { padding: "9px 15px", background: "#6d28d9", color: "white", border: 0, borderRadius: 8, cursor: "pointer" };
const input = { width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", font: "inherit" };
const normalize = value => String(value || "").trim().toLowerCase();

export default function CourseReviews({ role, email, courses = [] }) {
  const [reviews, setReviews] = useState(getReviews);
  const [courseKey, setCourseKey] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const studentEmail = normalize(email);
  useEffect(() => {
    const refresh = () => setReviews(getReviews());
    window.addEventListener(REVIEW_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener(REVIEW_EVENT, refresh); window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  const list = useMemo(() => courses.map(c => ({ ...c, reviewKey: courseReviewKey(c) })), [courses]);
  const selected = list.find(c => c.reviewKey === courseKey) || list[0];
  const selectedKey = selected?.reviewKey || "";
  const relevant = reviews.filter(r => list.some(c => c.reviewKey === r.courseKey));
  const own = reviews.find(r => r.courseKey === selectedKey && r.studentEmail === studentEmail);
  useEffect(() => { setRating(own?.rating || 5); setComment(own?.comment || ""); setNotice(""); }, [selectedKey, own?.updatedAt]);
  function submit(e) {
    e.preventDefault();
    if (!selected) return;
    const clean = comment.trim();
    if (clean.length < 3 || clean.length > 1000) { setNotice("Review 3 se 1000 characters ka hona chahiye."); return; }
    try {
      saveReview({ courseKey: selectedKey, courseTitle: selected.title, teacherEmail: normalize(selected.teacherEmail), studentEmail, rating: Number(rating), comment: clean, updatedAt: new Date().toISOString() });
      setNotice("Review saved successfully.");
    } catch { setNotice("Review save nahi hua. Browser storage check karo."); }
  }
  function erase() {
    if (!own || !window.confirm("Delete your review?")) return;
    try { removeReview(selectedKey, studentEmail); setNotice("Review deleted."); }
    catch { setNotice("Review delete nahi hua."); }
  }
  return <section style={{ padding: "12px 0" }}>
    <h2 style={{ marginBottom: 8 }}>{role === "teacher" ? "Course Reviews & Ratings" : "My Course Reviews"}</h2>
    <p style={{ color: "#6b7280", marginBottom: 20 }}>{role === "teacher" ? "Students ke reviews aur average ratings dekhein." : "Apne enrolled courses ko 1–5 stars aur review dein."}</p>
    {!list.length ? <div style={shell}>No courses available yet.</div> : <>
      {role === "student" && <form onSubmit={submit} style={shell}>
        <label style={{ display: "block", marginBottom: 12 }}>Course
          <select style={input} value={selectedKey} onChange={e => setCourseKey(e.target.value)}>
            {list.map(c => <option key={c.reviewKey} value={c.reviewKey}>{c.title}</option>)}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>Your rating
          <select style={input} value={rating} onChange={e => setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)} ({n}/5)</option>)}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>Your review
          <textarea style={{ ...input, minHeight: 105 }} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder="Course ke baare mein apna experience likhein..." />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" style={btn}>{own ? "Update Review" : "Submit Review"}</button>
          {own && <button type="button" onClick={erase} style={{ ...btn, background: "#b91c1c" }}>Delete Review</button>}
        </div>
        {notice && <p role="status">{notice}</p>}
      </form>}
      {list.map(course => {
        const items = relevant.filter(r => r.courseKey === course.reviewKey);
        const average = items.length ? (items.reduce((sum, r) => sum + Number(r.rating), 0) / items.length).toFixed(1) : null;
        return <article style={shell} key={course.reviewKey}>
          <h3 style={{ marginTop: 0 }}>{course.title}</h3>
          <p style={{ color: "#6d28d9", fontWeight: 600 }}>{average ? `★ ${average}/5 · ${items.length} review(s)` : "No ratings yet"}</p>
          {items.length === 0 ? <p style={{ color: "#6b7280" }}>Abhi koi review nahi hai.</p> : items.map(r => <div key={r.studentEmail} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
            <strong>{r.studentEmail === studentEmail && role === "student" ? "Your review" : r.studentEmail}</strong>
            <span style={{ marginLeft: 12, color: "#d97706" }}>{"★".repeat(Math.min(5, Math.max(1, Number(r.rating))))} ({r.rating}/5)</span>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBottom: 4 }}>{r.comment}</p>
            <small style={{ color: "#6b7280" }}>{new Date(r.updatedAt).toLocaleDateString()}</small>
          </div>)}
        </article>;
      })}
    </>}
    <p style={{ fontSize: 12, color: "#6b7280" }}>Frontend demo: Reviews sirf isi browser ke localStorage mein save hotay hain.</p>
  </section>;
}
