import { useEffect, useMemo, useState } from "react";
import { notifyEnrolledStudents } from "../../utils/demoNotifications";
import "./CourseQuizzes.css";
import "./CourseQuizzesStudent.css";
import StudentCourseQuizzes from "./StudentCourseQuizzes";

const QUIZ_PREFIX = "educonnect.quiz.v1.";
const ATTEMPT_PREFIX = "educonnect.quizAttempt.v1.";
const STUDENT_PREFIX = "educonnect.student.";
const EVENT = "educonnect:quizzes-updated";
const normalize = value => String(value ?? "").trim().toLowerCase();
const quizKey = (teacherEmail, courseId) =>
  `${QUIZ_PREFIX}${encodeURIComponent(normalize(teacherEmail))}.${encodeURIComponent(String(courseId))}`;
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
};
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyQuestion = () => ({ id: uid(), prompt: "", options: ["", "", "", ""], correct: 0 });
const initialForm = () => ({
  id: uid(), title: "", passingScore: 60, timeLimit: 0,
  questions: [emptyQuestion()], published: false,
});
const sanitizeQuiz = q => ({
  ...q,
  questions: (q.questions || []).map(item => ({
    ...item,
    options: [...(item.options || [])].slice(0,4),
  })),
});
function useQuizRecords() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion(v => v + 1);
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return version;
}
function TeacherQuizzes({ email, courses }) {
  const version = useQuizRecords();
  const [courseId, setCourseId] = useState("");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState(null);
  const selected = courses.find(c => String(c.id) === String(courseId)) || courses[0];
  const quizzes = useMemo(() => selected ? read(quizKey(email, selected.id), []) : [],
    [email, selected?.id, version]);
  const allAttempts = useMemo(() => {
    const records = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (!key.startsWith(ATTEMPT_PREFIX)) continue;
      const values = read(key, []);
      if (Array.isArray(values)) records.push(...values);
    }
    return records;
  }, [version]);
  const enrolledStudents = useMemo(() => {
    const byCourse = new Map();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (!key.startsWith(STUDENT_PREFIX) || !key.endsWith(".enrollments")) continue;
      const student = normalize(key.slice(STUDENT_PREFIX.length, -".enrollments".length));
      const enrollments = read(key, []);
      if (!Array.isArray(enrollments)) continue;
      enrollments.forEach(row => {
        if (row.teacherEmail && normalize(row.teacherEmail) !== normalize(email)) return;
        const id = String(row.id);
        if (!byCourse.has(id)) byCourse.set(id, new Map());
        byCourse.get(id).set(student, row);
      });
    }
    return byCourse;
  }, [email, version]);
  const updateQuestion = (index, patch) =>
    setEditing(old => ({ ...old, questions: old.questions.map((q,i) => i === index ? { ...q, ...patch } : q) }));
  const save = () => {
    const title = editing.title.trim();
    if (!title || !editing.questions.length ||
      editing.questions.some(q => !q.prompt.trim() || q.options.length !== 4 || q.options.some(o => !o.trim()) ||
        new Set(q.options.map(normalize)).size !== 4 || ![0,1,2,3].includes(Number(q.correct)))) {
      setMessage("Enter a quiz title, a question for each MCQ, four different options, and the correct answer.");
      return;
    }
    const passingScore = Number(editing.passingScore);
    const timeLimit = Number(editing.timeLimit);
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100 ||
        !Number.isInteger(timeLimit) || timeLimit < 0 || timeLimit > 180) {
      setMessage("The passing score must be between 0 and 100%, and the timer must be between 0 and 180 minutes.");
      return;
    }
    const record = {
      ...sanitizeQuiz(editing), title, passingScore, timeLimit,
      questions: editing.questions.map(q => ({ ...q, prompt:q.prompt.trim(), options:q.options.map(o => o.trim()), correct:Number(q.correct) })),
      teacherEmail: email, courseId: selected.id,
      updatedAt: new Date().toISOString(),
    };
    const previous = quizzes.find(q => q.id === record.id);
    const justPublished = record.published && !previous?.published;
    if (justPublished) record.publishedAt = new Date().toISOString();
    const next = previous ?
      quizzes.map(q => q.id === record.id ? record : q) : [...quizzes, record];
    write(quizKey(email, selected.id), next);
    if (justPublished) notifyEnrolledStudents(email, selected.id, {
      id: `quiz-published:${record.id}:${record.publishedAt}`, type: "quiz",
      title: "New quiz available", message: `${record.title} is now available in ${selected.title || "your course"}.`, link: "quizzes",
    });
    setEditing(null);
    setMessage("Quiz saved successfully.");
  };
  const remove = quiz => {
    if (!window.confirm(`Delete "${quiz.title}"? Past student attempts will remain in local demo storage.`)) return;
    write(quizKey(email, selected.id), quizzes.filter(q => q.id !== quiz.id));
    setMessage("Quiz deleted.");
  };
  const togglePublish = quiz => {
    const publishing = !quiz.published;
    const updated = { ...quiz, published: publishing, publishedAt: publishing ? new Date().toISOString() : quiz.publishedAt };
    write(quizKey(email, selected.id), quizzes.map(q => q.id === quiz.id ? updated : q));
    if (publishing) notifyEnrolledStudents(email, selected.id, {
      id: `quiz-published:${updated.id}:${updated.publishedAt}`, type: "quiz",
      title: "New quiz available", message: `${updated.title} is now available in ${selected.title || "your course"}.`, link: "quizzes",
    });
  };
  if (detail) {
    const quiz = quizzes.find(item => item.id === detail.quizId);
    if (quiz) {
      const roster = enrolledStudents.get(String(quiz.courseId)) || new Map();
      const latest = new Map();
      allAttempts.filter(a => a.quizId === quiz.id && normalize(a.teacherEmail) === normalize(email))
        .sort((a,b) => String(a.submittedAt).localeCompare(String(b.submittedAt)))
        .forEach(a => latest.set(normalize(a.studentEmail), a));
      const students = [...roster.entries()].map(([student, row]) => ({
        email: row.studentEmail || row.email || student,
        name: row.studentName || row.fullName || row.name || student,
        attempt: latest.get(student),
      }));
      const attempted = students.filter(s => s.attempt);
      const notAttempted = students.filter(s => !s.attempt);
      const average = attempted.length ? Math.round(attempted.reduce((sum,s) => sum + Number(s.attempt.percentage || 0), 0) / attempted.length) : null;
      const rows = detail.panel === "attempted" ? attempted : detail.panel === "notAttempted" ? notAttempted : students;
      return <div className="edc-quiz-root edc-quiz-detail-page">
        <section className="edc-quiz-panel">
          <button type="button" className="edc-quiz-back" onClick={() => setDetail(null)}>← Back to Course Quizzes</button>
          <h2>{quiz.title} · {detail.panel === "total" ? "Enrolled Students" : detail.panel === "attempted" ? "Students Who Attempted" : detail.panel === "notAttempted" ? "Students Who Have Not Attempted" : "Average Score"}</h2>
          {detail.panel === "average" && <p className="edc-quiz-average-summary">{average === null ? "No attempts yet" : `${average}% average score`} across {attempted.length} students who attempted this quiz.</p>}
          <div className="edc-quiz-roster">{rows.length ? rows.map(student => <article key={student.email}>
            <div><strong>{student.name}</strong><small>{student.email}</small></div>
            <span className={student.attempt ? "is-attempted" : "is-pending"}>{student.attempt ? `${student.attempt.percentage}% · ${student.attempt.passed ? "Passed" : "Not passed"}` : "Not attempted"}</span>
          </article>) : <p>{detail.panel === "notAttempted" ? "Every enrolled student has attempted this quiz." : detail.panel === "attempted" || detail.panel === "average" ? "No students have attempted this quiz yet." : "No students are enrolled in this course."}</p>}</div>
        </section>
      </div>;
    }
  }
  return <div className="edc-quiz-root edc-quiz-student">
    <header className="edc-quiz-header"><span>INSTRUCTOR TOOLS</span><h2>Course Quizzes & Assessments</h2>
      <p>Create MCQs, set passing marks and optional timers, then publish quizzes for enrolled students.</p></header>
    {!courses.length ? <div className="edc-quiz-panel">Create a course first to add quizzes.</div> : <>
      <label className="edc-quiz-label">Select your course
        <select value={selected ? String(selected.id) : ""} onChange={e => { setCourseId(e.target.value); setEditing(null); setMessage(""); }}>
          {courses.map(c => <option key={String(c.id)} value={String(c.id)}>{c.title || "Untitled Course"}</option>)}
        </select>
      </label>
      {message && <p className="edc-quiz-message" role="status">{message}</p>}
      {!editing && <button type="button" className="edc-quiz-primary" onClick={() => { setEditing(initialForm()); setMessage(""); }}>+ Create Quiz</button>}
      {editing && <section className="edc-quiz-panel">
        <h3>{quizzes.some(q => q.id === editing.id) ? "Edit Quiz" : "New Quiz"}</h3>
        <label className="edc-quiz-label">Quiz title<input value={editing.title} maxLength={120} onChange={e => setEditing(old=>({...old,title:e.target.value}))} placeholder="e.g. React Basics Assessment"/></label>
        <div className="edc-quiz-two">
          <label className="edc-quiz-label">Passing score (%)<input type="number" min="0" max="100" value={editing.passingScore} onChange={e => setEditing(old=>({...old,passingScore:e.target.value}))}/></label>
          <label className="edc-quiz-label">Time limit (minutes; 0 = none)<input type="number" min="0" max="180" value={editing.timeLimit} onChange={e => setEditing(old=>({...old,timeLimit:e.target.value}))}/></label>
        </div>
        <label className="edc-quiz-checkbox"><input type="checkbox" checked={editing.published} onChange={e => setEditing(old=>({...old,published:e.target.checked}))}/> Published (visible to enrolled students)</label>
        {editing.questions.map((q,i) => <div className="edc-quiz-question" key={q.id}>
          <div className="edc-quiz-between"><strong>Question {i+1}</strong>
            <button type="button" disabled={editing.questions.length === 1} onClick={() => setEditing(old=>({...old,questions:old.questions.filter((_,n)=>n!==i)}))}>Remove</button></div>
          <label className="edc-quiz-label">Question text<input value={q.prompt} onChange={e=>updateQuestion(i,{prompt:e.target.value})} placeholder="Write a question"/></label>
          {q.options.map((option,n)=><label className="edc-quiz-label" key={n}>Option {String.fromCharCode(65+n)}
            <input value={option} onChange={e=>updateQuestion(i,{options:q.options.map((o,k)=>k===n?e.target.value:o)})}/></label>)}
          <label className="edc-quiz-label">Correct answer
            <select value={q.correct} onChange={e=>updateQuestion(i,{correct:Number(e.target.value)})}>
              {q.options.map((_,n)=><option key={n} value={n}>Option {String.fromCharCode(65+n)}</option>)}
            </select></label>
        </div>)}
        <div className="edc-quiz-actions">
          <button type="button" onClick={()=>setEditing(old=>({...old,questions:[...old.questions,emptyQuestion()]}))}>+ Add MCQ</button>
          <button type="button" className="edc-quiz-primary" onClick={save}>Save Quiz</button>
          <button type="button" onClick={()=>setEditing(null)}>Cancel</button>
        </div>
      </section>}
      <section className="edc-quiz-panel"><h3>Quizzes for {selected?.title}</h3>
        {!quizzes.length ? <p>No quizzes created yet.</p> : quizzes.map(quiz=>{
          const attempts = allAttempts.filter(a => a.quizId === quiz.id);
          const roster = enrolledStudents.get(String(quiz.courseId)) || new Map();
          const latest = new Map();
          attempts.filter(a => normalize(a.teacherEmail) === normalize(email))
            .sort((a,b) => String(a.submittedAt).localeCompare(String(b.submittedAt)))
            .forEach(a => latest.set(normalize(a.studentEmail), a));
          const attemptedCount = [...roster.keys()].filter(student => latest.has(student)).length;
          const notAttemptedCount = Math.max(0, roster.size - attemptedCount);
          const scores = [...roster.keys()].map(student => latest.get(student)).filter(Boolean);
          const average = scores.length ? Math.round(scores.reduce((sum,a)=>sum+Number(a.percentage||0),0)/scores.length) : null;
          return <article className="edc-quiz-listitem" key={quiz.id}>
            <div><strong>{quiz.title}</strong><p>{quiz.questions.length} questions · {quiz.published?"Published":"Draft"} · Pass {quiz.passingScore}% · {quiz.timeLimit ? `${quiz.timeLimit} min`:"No timer"}</p>
              <small>{attemptedCount} of {roster.size} enrolled students attempted · Average: {average === null ? "—" : `${average}%`}</small></div>
            <div className="edc-quiz-stats">
              <button type="button" onClick={() => setDetail({quizId:quiz.id,panel:"total"})}><small>Total students</small><strong>{roster.size}</strong></button>
              <button type="button" onClick={() => setDetail({quizId:quiz.id,panel:"attempted"})}><small>Attempted</small><strong>{attemptedCount}</strong></button>
              <button type="button" onClick={() => setDetail({quizId:quiz.id,panel:"notAttempted"})}><small>Not attempted</small><strong>{notAttemptedCount}</strong></button>
              <button type="button" onClick={() => setDetail({quizId:quiz.id,panel:"average"})}><small>Average score</small><strong>{average === null ? "—" : `${average}%`}</strong></button>
            </div>
            <div className="edc-quiz-actions">
              <button type="button" onClick={()=>{setEditing(sanitizeQuiz(quiz));setMessage("");}}>Edit</button>
              <button type="button" onClick={()=>togglePublish(quiz)}>{quiz.published?"Unpublish":"Publish"}</button>
              <button type="button" onClick={()=>remove(quiz)}>Delete</button>
            </div>
          </article>;
        })}
      </section>
    </>}
    <p className="edc-quiz-foot">Demo only: quizzes and attempts are saved in this browser's localStorage. Editing a quiz changes future attempts, not historical scores.</p>
  </div>;
}
export default function CourseQuizzes({ role, email, courses = [], ...props }) {
  return role === "teacher"
    ? <TeacherQuizzes email={email} courses={courses}/>
    : <StudentCourseQuizzes key={email} email={email} courses={courses} {...props}/>;
}
