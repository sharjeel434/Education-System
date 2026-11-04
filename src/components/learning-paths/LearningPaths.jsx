import { useEffect, useMemo, useState } from "react";
import "./LearningPaths.css";

const PATH_PREFIX = "educonnect.learningPaths.v1.";
const QUIZ_PREFIX = "educonnect.quiz.v1.";
const ATTEMPT_PREFIX = "educonnect.quizAttempt.v1.";
const ASSIGNMENT_PREFIX = "educonnect.assignments.v1.";
const SUBMISSION_PREFIX = "educonnect.assignmentSubmissions.v1.";
const EVENT = "educonnect:learning-paths-updated";
const norm = v => String(v ?? "").trim().toLowerCase();
const encode = v => encodeURIComponent(String(v ?? ""));
const keyFor = email => PATH_PREFIX + encode(norm(email));
const courseKey = c => `${norm(c.teacherEmail)}::${String(c.id)}`;
const quizKey = c => `${QUIZ_PREFIX}${encode(norm(c.teacherEmail))}.${encode(c.id)}`;
const assignmentKey = c => `${ASSIGNMENT_PREFIX}${encode(norm(c.teacherEmail))}.${encode(c.id)}`;
const attemptKey = (email, id) => `${ATTEMPT_PREFIX}${encode(norm(email))}.${encode(id)}`;
const submissionKey = (email, id) => `${SUBMISSION_PREFIX}${encode(norm(email))}.${encode(id)}`;
const load = (key, fallback=[]) => {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); return Array.isArray(v) ? v : fallback; }
  catch { return fallback; }
};
const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
};
const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const formatDate = date => date ? new Date(date).toLocaleDateString() : "—";
function completion(course, email) {
  const videosTotal = Math.max(0, Number(course.lessons) || 0);
  const videosDone = Math.min(videosTotal, Math.max(0, Number(course.completedLessons) || 0));
  const quizzes = course.teacherEmail ? load(quizKey(course)).filter(q => q.published) : [];
  const quizDone = quizzes.filter(q => load(attemptKey(email, q.id)).some(a => a.passed)).length;
  const assignments = course.teacherEmail ? load(assignmentKey(course)).filter(a => a.published) : [];
  const assignmentsDone = assignments.filter(a => load(submissionKey(email, a.id)).some(s => s.gradedAt && s.marks !== null && s.marks !== undefined)).length;
  const required = videosTotal + quizzes.length + assignments.length;
  const done = videosDone + quizDone + assignmentsDone;
  return { videosTotal, videosDone, quizzesTotal:quizzes.length, quizDone,
    assignmentsTotal:assignments.length, assignmentsDone, required, done,
    percent: required ? Math.round(done / required * 100) : 0,
    completed: required > 0 && done === required };
}
function useStorageVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion(v => v+1);
    ["storage","focus",EVENT,"educonnect:quizzes-updated","educonnect:assignments-updated","educonnect:teacher-courses-changed"].forEach(name=>window.addEventListener(name,refresh));
    return () => ["storage","focus",EVENT,"educonnect:quizzes-updated","educonnect:assignments-updated","educonnect:teacher-courses-changed"].forEach(name=>window.removeEventListener(name,refresh));
  }, []);
  return version;
}
export default function LearningPaths({ email, courses=[] }) {
  const version = useStorageVersion();
  const storageKey = keyFor(email);
  const [title, setTitle] = useState("");
  const [selection, setSelection] = useState([]);
  const [message, setMessage] = useState("");
  const paths = useMemo(() => load(storageKey), [storageKey,version]);
  const courseMap = useMemo(() => new Map(courses.map(c=>[courseKey(c),c])), [courses]);
  const evaluated = useMemo(() => paths.map(path => {
    const steps = path.courseKeys.map(k => {
      const course = courseMap.get(k);
      return { key:k, course, status:course?completion(course,email):null };
    });
    const required = steps.reduce((n,s)=>n+(s.status?.required || 0),0);
    const done = steps.reduce((n,s)=>n+(s.status?.done || 0),0);
    const allCompleted = steps.length > 0 && steps.every(s=>s.status?.completed);
    return { ...path, steps, percent:required?Math.round(done/required*100):0, allCompleted };
  }), [paths,courseMap,email]);
  useEffect(() => {
    const changed = paths.map(path => {
      const evaluatedPath = evaluated.find(p=>p.id===path.id);
      if (!path.completedAt && evaluatedPath?.allCompleted) return {...path,completedAt:new Date().toISOString()};
      return path;
    });
    if (changed.some((p,i)=>p.completedAt!==paths[i].completedAt)) save(storageKey,changed);
  }, [evaluated,paths,storageKey]);
  const add = () => {
    if (!title.trim()) { setMessage("Enter a learning path title."); return; }
    if (!selection.length) { setMessage("Choose at least one enrolled course."); return; }
    const path = {id:uid(),title:title.trim().slice(0,100),courseKeys:selection,
      createdAt:new Date().toISOString(),completedAt:null};
    save(storageKey,[...paths,path]);
    setTitle("");setSelection([]);setMessage("Learning path created.");
  };
  const remove = path => {
    if (!window.confirm(`Delete learning path "${path.title}"? Your actual course progress will not be deleted.`)) return;
    save(storageKey,paths.filter(p=>p.id!==path.id));
  };
  const move = (key, direction) => {
    setSelection(old => {
      const i = old.indexOf(key), j=i+direction;
      if (i<0 || j<0 || j>=old.length) return old;
      const next=[...old];[next[i],next[j]]=[next[j],next[i]];return next;
    });
  };
  return <div className="edlp-root">
    <header className="edlp-hero"><span>YOUR LEARNING JOURNEY</span><h2>Learning Paths & Course Completion</h2>
      <p>Arrange enrolled courses into a learning path. Track videos, passed quizzes and graded assignments together.</p></header>
    <div className="edlp-summary">
      <div><strong>{paths.length}</strong><span>My Learning Paths</span></div>
      <div><strong>{evaluated.filter(p=>p.completedAt).length}</strong><span>Completed Paths</span></div>
      <div><strong>{evaluated.filter(p=>!p.completedAt).length}</strong><span>In Progress</span></div>
    </div>
    <section className="edlp-panel"><h3>Create a Learning Path</h3>
      <label className="edlp-label">Path name<input maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Frontend Developer Journey"/></label>
      {!courses.length ? <p>Enroll in at least one course to build a learning path.</p> : <>
        <p>Choose enrolled courses in the order you want to learn them:</p>
        <div className="edlp-course-options">
          {courses.map(c=>{
            const k=courseKey(c), selected=selection.includes(k);
            return <label key={k} className="edlp-choice"><input type="checkbox" checked={selected}
              onChange={e=>setSelection(old=>e.target.checked?[...old,k]:old.filter(x=>x!==k))}/>
              <span>{c.title}</span></label>;
          })}
        </div>
        {!!selection.length && <div className="edlp-order"><h4>Course sequence</h4>
          {selection.map((k,i)=><div key={k} className="edlp-order-row">
            <span>{i+1}. {courseMap.get(k)?.title||"Unavailable course"}</span>
            <div><button type="button" disabled={!i} onClick={()=>move(k,-1)} aria-label={`Move course ${i+1} up`}>↑</button>
              <button type="button" disabled={i===selection.length-1} onClick={()=>move(k,1)} aria-label={`Move course ${i+1} down`}>↓</button></div>
          </div>)}
        </div>}
      </>}
      {message && <p role="status" className="edlp-message">{message}</p>}
      <button type="button" className="edlp-primary" disabled={!courses.length} onClick={add}>Create Learning Path</button>
    </section>
    <section className="edlp-panel"><h3>My Learning Paths</h3>
      {!evaluated.length ? <p>No learning paths created yet.</p> : evaluated.map(path=>{
        const completed = Boolean(path.completedAt);
        const milestones = [
          {name:"First Step",earned:path.steps.some(s=>(s.status?.done||0)>0)},
          {name:"Halfway Hero",earned:path.percent>=50},
          {name:"Path Champion",earned:completed},
        ];
        return <article className="edlp-path" key={path.id}>
          <div className="edlp-between"><div><h3>{path.title}</h3>
            <small>Created: {formatDate(path.createdAt)} · {path.steps.length} course(s)</small></div>
            <button type="button" onClick={()=>remove(path)}>Delete Path</button></div>
          <div className="edlp-between"><strong>Overall progress: {path.percent}%</strong><span>{completed?"Completed":"In progress"}</span></div>
          <div className="edlp-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={path.percent} aria-label={`${path.title} progress`}>
            <div style={{width:`${path.percent}%`}}/></div>
          <div className="edlp-steps">{path.steps.map((step,i)=><div key={step.key} className="edlp-step">
            <div className="edlp-between"><strong>{i+1}. {step.course?.title||"Course not found in enrollments"}</strong>
              <span>{step.status?.completed?"✓ Complete":step.status?`${step.status.percent}%`:"Unavailable"}</span></div>
            {step.status ? <small>Lessons: {step.status.videosDone}/{step.status.videosTotal} · Passed quizzes: {step.status.quizDone}/{step.status.quizzesTotal} · Graded assignments: {step.status.assignmentsDone}/{step.status.assignmentsTotal}</small> :
              <small>Re-enroll in this course to resume tracking.</small>}
          </div>)}</div>
          <div className="edlp-badges">{milestones.map(m=><span key={m.name} className={m.earned?"edlp-earned":"edlp-locked"}>{m.earned?"🏅":"🔒"} {m.name}</span>)}</div>
          {completed && <p className="edlp-completed">Learning path completed on {formatDate(path.completedAt)}. Your completion record is saved in this browser.</p>}
        </article>;
      })}
    </section>
    <p className="edlp-foot">Completion rules: finish all course lessons, pass every published quiz at least once, and receive a grade for every published assignment. Courses without any tracked lessons or assessments remain incomplete. Progress is calculated from this browser's local data; badges are demo achievements, not accredited certificates. Publishing new assessments can change live progress percentages, while a previously earned completion record is retained.</p>
  </div>;
}
