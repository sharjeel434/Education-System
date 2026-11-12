import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, Reply, Search, Send } from "lucide-react";
import { courseDiscussionKey, makeDiscussionId, readDiscussions, saveDiscussions, subscribeDiscussions } from "../../utils/courseDiscussions";
import { discussionName, discussionProfile, discussionReplies, filterCourseDiscussions, notifyDiscussionReply, visibleCourseDiscussions } from "../../utils/discussionHelpers";
import ReportAction from "../moderation/ReportAction";
import StudentCourseDiscussions from "./StudentCourseDiscussions";
import "./CourseDiscussions.css";

function TeacherCourseDiscussions({ email = "", courses = [] }) {
  const user = email.trim().toLowerCase();
  const [items, setItems] = useState(() => readDiscussions());
  const [courseId, setCourseId] = useState("all");
  const [search, setSearch] = useState("");
  const [replies, setReplies] = useState({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    const refresh = () => setItems(readDiscussions());
    const unsubscribe = subscribeDiscussions(refresh);
    window.addEventListener("educonnect:moderation-visibility-changed", refresh);
    return () => { unsubscribe(); window.removeEventListener("educonnect:moderation-visibility-changed", refresh); };
  }, []);
  const owned = useMemo(() => courses.map(course => ({ ...course, teacherEmail: course.teacherEmail || user })), [courses, user]);
  const visible = filterCourseDiscussions(visibleCourseDiscussions(items, owned), { course: courseId, search });
  function updateQuestion(id, transform) {
    const latest = readDiscussions();
    if (!visibleCourseDiscussions(latest, owned).some(item => item.id === id)) { setMessage("This question is no longer available."); return null; }
    let changed;
    const next = latest.map(item => item.id === id ? (changed = transform(item)) : item);
    if (!saveDiscussions(next)) { setMessage("Could not save your answer. Please try again."); return null; }
    setItems(next); return changed;
  }
  function answer(item) {
    const text = (replies[item.id] || "").trim();
    if (text.length < 2 || text.length > 3000) { setMessage("Write an answer between 2 and 3,000 characters."); return; }
    const profile = discussionProfile("teacher", user);
    const changed = updateQuestion(item.id, question => ({ ...question, reply: { ...question.reply,
      id: question.reply?.id || makeDiscussionId(), text, teacherEmail: user,
      teacherName: discussionName(user, "", "teacher"), teacherAvatar: profile.avatar || "", createdAt: new Date().toISOString(),
    } }));
    if (!changed) return;
    notifyDiscussionReply(changed, changed.reply, true);
    setReplies(previous => ({ ...previous, [item.id]: "" })); setMessage("Instructor answer saved.");
  }
  return <section className="edc-qa-page">
    <header className="edc-qa-heading"><div><span className="edc-qa-eyebrow">COURSE COMMUNITY</span><h2><MessageCircle size={23}/> Course Questions &amp; Answers</h2><p>Reply to questions on your courses and mark them resolved.</p></div><span className="edc-qa-count">{visible.length} questions</span></header>
    {message && <p className="edc-qa-message" role="status">{message}</p>}
    {!owned.length ? <div className="edc-qa-empty">Create a course to receive questions.</div> : <>
      <div className="edc-qa-filters"><label>Course<select value={courseId} onChange={event => setCourseId(event.target.value)}><option value="all">All my courses</option>{owned.map(course => <option key={courseDiscussionKey(course)} value={courseDiscussionKey(course)}>{course.title}</option>)}</select></label><label>Search questions<div className="edc-qa-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search questions or replies"/></div></label></div>
      <div className="edc-qa-list">{visible.length ? visible.map(item => <article className="edc-qa-card" key={item.id}>
        <div className="edc-qa-meta"><span>{item.courseTitle}</span>{item.lessonTitle && <span>Lesson: {item.lessonTitle}</span>}{item.resolved && <span className="edc-qa-resolved"><CheckCircle2 size={14}/> Resolved</span>}</div>
        <h3>{item.title}</h3><small>Asked by {discussionName(item.studentEmail, item.studentName)} · {new Date(item.createdAt).toLocaleString()}</small>
        {item.body && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}>{item.body}</p>}
        {item.reply?.text && <div className="edc-qa-answer"><strong><Reply size={16}/> Instructor answer</strong><p>{item.reply.text}</p><small>{new Date(item.reply.createdAt).toLocaleString()}</small></div>}
        {discussionReplies(item).map(reply => <div className="edc-qa-answer" key={reply.id}><strong>{reply.name || discussionName(reply.email)}</strong><p>{reply.text}</p><small>{new Date(reply.createdAt).toLocaleString()}</small></div>)}
        <div className="edc-qa-actions"><button type="button" onClick={() => { const changed = updateQuestion(item.id, question => ({ ...question, resolved: !question.resolved })); if (changed) setMessage(changed.resolved ? "Question marked resolved." : "Question reopened."); }}><CheckCircle2 size={15}/> {item.resolved ? "Reopen" : "Mark resolved"}</button><ReportAction reporterEmail={email} reporterName={email} reporterRole="Teacher" target={{ reportType: "content", targetType: "comment", targetId: String(item.id), targetTitle: `Question: ${item.title}`, targetOwnerEmail: item.studentEmail, targetRole: "Student" }}/>{item.studentEmail && <ReportAction label="Report student" reporterEmail={email} reporterName={email} reporterRole="Teacher" target={{ reportType: "user", targetType: "user", targetId: item.studentEmail, targetTitle: item.studentEmail, targetRole: "Student", targetOwnerEmail: item.studentEmail }}/>}</div>
        <div className="edc-qa-reply-form"><textarea rows={2} value={replies[item.id] || ""} onChange={event => setReplies(previous => ({ ...previous, [item.id]: event.target.value }))} placeholder={item.reply ? "Update your answer" : "Write an answer"} maxLength={3000}/><button type="button" onClick={() => answer(item)}><Send size={15}/> {item.reply ? "Update Reply" : "Send Reply"}</button></div>
      </article>) : <div className="edc-qa-empty">No questions found. Questions from students will appear here.</div>}</div>
    </>}
    <p className="edc-qa-note">Discussions and replies are stored in this browser.</p>
  </section>;
}

export default function CourseDiscussions({ role, ...props }) {
  return role === "teacher" ? <TeacherCourseDiscussions {...props}/> : <StudentCourseDiscussions {...props}/>;
}
