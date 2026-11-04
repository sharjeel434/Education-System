import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Send, ThumbsUp, CheckCircle2, Reply, Trash2 } from "lucide-react";
import { courseDiscussionKey, makeDiscussionId, readDiscussions, saveDiscussions, subscribeDiscussions } from "../../utils/courseDiscussions";
import "./CourseDiscussions.css";

export default function CourseDiscussions({ role, email = "", courses = [] }) {
  const teacher = role === "teacher";
  const normalizedEmail = email.trim().toLowerCase();
  const [items, setItems] = useState(readDiscussions);
  const [courseId, setCourseId] = useState("all");
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [lesson, setLesson] = useState("");
  const [replies, setReplies] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => subscribeDiscussions(() => setItems(readDiscussions())), []);
  const owned = useMemo(() => courses.map(course => ({
    course, key: courseDiscussionKey(course),
  })), [courses]);
  const allowed = new Set(owned.map(entry => entry.key));
  const visible = items.filter(item => allowed.has(item.courseKey) && (courseId === "all" || item.courseKey === courseId))
    .filter(item => [item.title, item.body, item.lessonTitle, item.reply?.text].join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function update(mutator) {
    const latest = readDiscussions();
    const updated = mutator(latest);
    if (!saveDiscussions(updated)) setMessage("Unable to save. Check browser storage settings.");
  }
  function ask(event) {
    event.preventDefault();
    const selected = owned.find(entry => entry.key === courseId);
    if (!selected || question.trim().length < 5) {
      setMessage("Select an enrolled course and write at least 5 characters."); return;
    }
    const now = new Date().toISOString();
    update(prev => [{ id: makeDiscussionId(), courseKey: selected.key,
      courseTitle: selected.course.title, teacherEmail: String(selected.course.teacherEmail || "").toLowerCase(),
      studentEmail: normalizedEmail, title: question.trim().slice(0, 300), body: "",
      lessonTitle: lesson.trim().slice(0, 120), createdAt: now, votes: [], resolved: false, reply: null }, ...prev]);
    setQuestion(""); setLesson(""); setMessage("Question posted (browser demo).");
  }
  function vote(item) {
    update(prev => prev.map(q => q.id === item.id ? {
      ...q, votes: (q.votes || []).includes(normalizedEmail)
        ? q.votes.filter(v => v !== normalizedEmail) : [...(q.votes || []), normalizedEmail]
    } : q));
  }
  function answer(item) {
    const text = (replies[item.id] ?? "").trim();
    if (text.length < 2) { setMessage("Write a reply before submitting."); return; }
    update(prev => prev.map(q => q.id === item.id ? {
      ...q, reply: { text: text.slice(0, 3000), teacherEmail: normalizedEmail, createdAt: new Date().toISOString() }
    } : q));
    setReplies(prev => ({ ...prev, [item.id]: "" })); setMessage("Teacher reply saved.");
  }
  function resolve(item) {
    update(prev => prev.map(q => q.id === item.id ? { ...q, resolved: !q.resolved } : q));
  }
  function remove(item) {
    if (!window.confirm("Delete this question?")) return;
    update(prev => prev.filter(q => q.id !== item.id));
  }
  return <section className="edc-qa-page">
    <header className="edc-qa-heading"><div><span className="edc-qa-eyebrow">COURSE COMMUNITY</span>
      <h2><MessageCircle size={23}/> Course Questions & Answers</h2>
      <p>{teacher ? "Reply to questions on your courses and mark them resolved." : "Ask questions about your enrolled courses and learn from answers."}</p></div>
      <span className="edc-qa-count">{visible.length} questions</span></header>
    {message && <p className="edc-qa-message" role="status">{message}</p>}
    {!owned.length ? <div className="edc-qa-empty">{teacher ? "Create a course to receive questions." : "Enroll in a course to ask questions."}</div> : <>
      <div className="edc-qa-filters"><label>Course
        <select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="all">All my courses</option>
          {owned.map(({course,key}) => <option key={key} value={key}>{course.title}</option>)}</select></label>
        <label>Search questions<div className="edc-qa-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions or replies"/></div></label></div>
      {!teacher && <form className="edc-qa-form" onSubmit={ask}>
        <h3>Ask a question</h3><p>Choose an enrolled course above, then write your question.</p>
        <input value={lesson} onChange={e=>setLesson(e.target.value)} maxLength={120} placeholder="Lesson title (optional)"/>
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} rows={3} placeholder="What would you like to ask your instructor?" required/>
        <button type="submit" disabled={courseId === "all"}><Send size={16}/> Post Question</button>
      </form>}
      <div className="edc-qa-list">{visible.length === 0 ? <div className="edc-qa-empty">No questions found. {teacher ? "Questions from students will appear here." : "Select a course and ask the first question."}</div> : visible.map(item =>
        <article className="edc-qa-card" key={item.id}>
          <div className="edc-qa-meta"><span>{item.courseTitle}</span>{item.lessonTitle && <span>Lesson: {item.lessonTitle}</span>}
            {item.resolved && <span className="edc-qa-resolved"><CheckCircle2 size={14}/> Resolved</span>}</div>
          <h3>{item.title}</h3><small>Asked by {teacher ? item.studentEmail : item.studentEmail === normalizedEmail ? "You" : "Student"} · {new Date(item.createdAt).toLocaleString()}</small>
          {item.reply?.text && <div className="edc-qa-answer"><strong><Reply size={16}/> Instructor answer</strong><p>{item.reply.text}</p><small>{new Date(item.reply.createdAt).toLocaleString()}</small></div>}
          <div className="edc-qa-actions">
            {!teacher && <button type="button" onClick={()=>vote(item)} aria-pressed={(item.votes || []).includes(normalizedEmail)}><ThumbsUp size={15}/> Helpful ({(item.votes || []).length})</button>}
            {teacher && <button type="button" onClick={()=>resolve(item)}><CheckCircle2 size={15}/> {item.resolved ? "Reopen" : "Mark resolved"}</button>}
            {(!teacher && item.studentEmail === normalizedEmail) && <button type="button" onClick={()=>remove(item)}><Trash2 size={15}/> Delete my question</button>}
          </div>
          {teacher && <div className="edc-qa-reply-form"><textarea rows={2} value={replies[item.id] ?? ""} onChange={e=>setReplies(prev=>({...prev,[item.id]:e.target.value}))} placeholder={item.reply ? "Update your answer" : "Write an answer"} maxLength={3000}/>
            <button type="button" onClick={()=>answer(item)}><Send size={15}/> {item.reply ? "Update Reply" : "Send Reply"}</button></div>}
        </article>)}</div>
    </>}
    <p className="edc-qa-note">Demo only: discussions are saved in this browser's localStorage. Different devices cannot sync without a backend.</p>
  </section>;
}
