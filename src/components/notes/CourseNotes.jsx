import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, NotebookPen, Search, Trash2, Pencil, Save, Clock3, Play } from "lucide-react";
import "./CourseNotes.css";

const keyFor = email => `educonnect.student.${String(email).trim().toLowerCase()}.courseNotes.v1`;
const read = email => { try { const value = JSON.parse(localStorage.getItem(keyFor(email)) || "{}"); return { notes: Array.isArray(value.notes) ? value.notes : [], bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [] }; } catch { return { notes: [], bookmarks: [] }; } };
const courseKey = course => `${String(course.teacherEmail || course.instructorEmail || "demo").toLowerCase()}::${String(course.id)}`;
const makeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const fmt = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const lessonTitle = (course, i) => course?.lessonItems?.[i]?.title || `Lesson ${i + 1}`;

export default function CourseNotes({ email = "student", courses = [], activeCourse, activeLessonIndex = 0, currentTime = 0, canTimestamp = false, onJump, compact = false }) {
  const [data, setData] = useState(() => read(email));
  const [courseId, setCourseId] = useState("all");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [saveTime, setSaveTime] = useState(false);
  useEffect(() => setData(read(email)), [email]);
  useEffect(() => { if (compact) { setCourseId(courseKey(activeCourse)); setLessonIndex(activeLessonIndex); setSaveTime(false); } }, [compact, activeCourse?.id, activeCourse?.teacherEmail, activeLessonIndex]);
  const selected = compact ? activeCourse : courses.find(c => courseKey(c) === courseId);
  const selectedKey = selected ? courseKey(selected) : "";
  const activeIndex = compact ? activeLessonIndex : lessonIndex;
  const persist = next => { try { localStorage.setItem(keyFor(email), JSON.stringify(next)); setData(next); setNotice(""); return true; } catch { setNotice("Could not save. Browser storage may be full or disabled."); return false; } };
  const bookmarkId = selected ? `${selectedKey}::${activeIndex}` : "";
  const isBookmarked = data.bookmarks.some(b => b.key === bookmarkId);
  const toggleBookmark = () => {
    if (!selected) return;
    persist({ ...data, bookmarks: isBookmarked ? data.bookmarks.filter(b => b.key !== bookmarkId) : [...data.bookmarks, { key: bookmarkId, courseKey: selectedKey, lessonIndex: activeIndex, createdAt: new Date().toISOString() }] });
  };
  const saveNote = event => {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    const text = draft.trim().slice(0, 5000);
    const now = new Date().toISOString();
    const notes = editingId ? data.notes.map(n => n.id === editingId ? { ...n, text, updatedAt: now } : n)
      : [{ id: makeId(), courseKey: selectedKey, lessonIndex: activeIndex, text, seconds: compact && canTimestamp && saveTime ? Math.floor(currentTime) : null, createdAt: now, updatedAt: now }, ...data.notes];
    if (persist({ ...data, notes })) { setDraft(""); setEditingId(null); setSaveTime(false); }
  };
  const startEdit = n => { setEditingId(n.id); setDraft(n.text); setCourseId(n.courseKey); setLessonIndex(n.lessonIndex); };
  const cancelEdit = () => { setEditingId(null); setDraft(""); };
  const known = useMemo(() => new Map(courses.map(c => [courseKey(c), c])), [courses]);
  const visibleNotes = data.notes.filter(n => known.has(n.courseKey) && (compact ? n.courseKey === selectedKey && n.lessonIndex === activeIndex : (courseId === "all" || n.courseKey === courseId)) && (!search || `${n.text} ${known.get(n.courseKey)?.title || ""} ${lessonTitle(known.get(n.courseKey), n.lessonIndex)}`.toLowerCase().includes(search.toLowerCase())));
  const visibleBookmarks = data.bookmarks.filter(b => known.has(b.courseKey) && (compact ? b.courseKey === selectedKey && b.lessonIndex === activeIndex : courseId === "all" || b.courseKey === courseId));
  const go = (course, index, seconds = 0) => { if (onJump) onJump(course.id, index, seconds); };
  return <section className={`edc-notes ${compact ? "edc-notes-compact" : "edc-panel"}`}>
    <header className="edc-notes-header"><NotebookPen size={21}/><div><h3>Notes & Bookmarks</h3><p>Private notes saved in this browser</p></div></header>
    {!compact && <div className="edc-notes-filters"><label>Course<select value={courseId} onChange={e => { setCourseId(e.target.value); setLessonIndex(0); cancelEdit(); }}><option value="all">All enrolled courses</option>{courses.map(c => <option key={courseKey(c)} value={courseKey(c)}>{c.title}</option>)}</select></label><label>Search notes<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your notes..." /></label></div>}
    {!compact && courseId === "all" && <p className="edc-notes-help">Choose a course above to add notes or bookmark a lesson. Your saved notes appear below.</p>}
    {selected && <><div className="edc-notes-filters">{!compact && <label>Lesson<select value={activeIndex} onChange={e => { setLessonIndex(Number(e.target.value)); cancelEdit(); }}>{Array.from({ length: selected.lessons || selected.lessonItems?.length || 1 }, (_, i) => <option key={i} value={i}>{lessonTitle(selected, i)}</option>)}</select></label>}<button type="button" className="edc-notes-bookmark" onClick={toggleBookmark}>{isBookmarked ? <BookmarkCheck size={17}/> : <Bookmark size={17}/>} {isBookmarked ? "Bookmarked" : "Bookmark lesson"}</button></div>
      <form onSubmit={saveNote} className="edc-notes-form"><textarea required maxLength={5000} rows={3} placeholder={`Write a note for ${lessonTitle(selected, activeIndex)}...`} value={draft} onChange={e => setDraft(e.target.value)}/>{compact && canTimestamp && !editingId && <label className="edc-notes-timestamp"><input type="checkbox" checked={saveTime} onChange={e => setSaveTime(e.target.checked)}/> Save video time ({fmt(currentTime)})</label>}{compact && !canTimestamp && <small>Video timestamps are supported for HTML video lessons. Embedded YouTube videos do not expose playback time here.</small>}<div className="edc-notes-actions"><button type="submit" className="edc-notes-primary"><Save size={16}/> {editingId ? "Update note" : "Save note"}</button>{editingId && <button type="button" onClick={cancelEdit}>Cancel edit</button>}</div></form>
    </>}
    {notice && <p role="alert" className="edc-notes-error">{notice}</p>}
    <h4>Saved Notes ({visibleNotes.length})</h4>
    {visibleNotes.length === 0 && <p className="edc-notes-help">No notes yet.</p>}
    <div className="edc-notes-list">{visibleNotes.map(n => { const c = known.get(n.courseKey); return <article key={n.id} className="edc-notes-item"><div className="edc-notes-meta">{c.title} · {lessonTitle(c, n.lessonIndex)} {n.seconds !== null && <span><Clock3 size={13}/> {fmt(n.seconds)}</span>}</div><p>{n.text}</p><div className="edc-notes-actions">{n.seconds !== null && <button type="button" onClick={() => go(c, n.lessonIndex, n.seconds)}><Play size={14}/> Jump to {fmt(n.seconds)}</button>}<button type="button" onClick={() => startEdit(n)}><Pencil size={14}/> Edit</button><button type="button" onClick={() => { if (window.confirm("Delete this note?")) { persist({ ...data, notes: data.notes.filter(x => x.id !== n.id) }); if (editingId === n.id) cancelEdit(); } }}><Trash2 size={14}/> Delete</button></div></article>; })}</div>
    <h4>Bookmarked Lessons ({visibleBookmarks.length})</h4>
    {visibleBookmarks.length === 0 && <p className="edc-notes-help">No bookmarks yet.</p>}
    <div className="edc-notes-list">{visibleBookmarks.map(b => { const c = known.get(b.courseKey); return <div className="edc-notes-item edc-notes-bookmark-item" key={b.key}><span><BookmarkCheck size={16}/> {c.title} · {lessonTitle(c, b.lessonIndex)}</span><div className="edc-notes-actions"><button type="button" onClick={() => go(c, b.lessonIndex)}><Play size={14}/> Open</button><button type="button" onClick={() => persist({ ...data, bookmarks: data.bookmarks.filter(x => x.key !== b.key) })}><Trash2 size={14}/> Remove</button></div></div>; })}</div>
  </section>;
}
