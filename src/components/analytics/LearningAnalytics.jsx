import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Flame, PlayCircle } from "lucide-react";
import "./LearningAnalytics.css";

const localDay = (date = new Date()) => {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const formatTime = seconds => {
  const minutes = Math.floor((Number(seconds) || 0) / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};
export default function LearningAnalytics({ courses = [], activity = {} }) {
  const [detail, setDetail] = useState("");
  const days = activity.days || {};
  const now = new Date();
  const recentDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = localDay(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }), seconds: Math.max(0, Number(days[key]) || 0) };
  }), [activity]);
  const monthPrefix = localDay(now).slice(0, 7);
  const monthlySeconds = Object.entries(days).filter(([day]) => day.startsWith(monthPrefix))
    .reduce((sum, [, seconds]) => sum + Math.max(0, Number(seconds) || 0), 0);
  const today = localDay(now);
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!(Number(days[today]) > 0)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 365 && Number(days[localDay(cursor)]) > 0; i++) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const completed = courses.filter(c => Number(c.progress) === 100).length;
  const totalLessons = courses.reduce((sum, c) => sum + Math.max(0, Number(c.lessons) || 0), 0);
  const completedLessons = courses.reduce((sum, c) => sum + Math.max(0, Number(c.completedLessons) || 0), 0);
  const maxSeconds = Math.max(60, ...recentDays.map(d => d.seconds));
  const milestones = [
    { title: "First Steps", earned: (Number(activity.totalSeconds) || 0) >= 60, detail: "Watch 1 minute" },
    { title: "Focused Learner", earned: (Number(activity.totalSeconds) || 0) >= 1800, detail: "Watch 30 minutes" },
    { title: "Consistent Learner", earned: streak >= 3, detail: "3-day learning streak" },
    { title: "Course Finisher", earned: completed > 0, detail: "Complete a course" },
  ];

  if (detail) {
    const isCompletedView = detail === "completed";
    const isVideoView = detail === "video";
    const isStreakView = detail === "streak";
    const detailCourses = isCompletedView
      ? courses.filter(course => Number(course.progress) === 100)
      : courses;
    const watchedDays = Object.entries(days)
      .filter(([, seconds]) => Number(seconds) > 0)
      .sort(([a], [b]) => b.localeCompare(a));
    const title = isCompletedView
      ? "Completed courses"
      : isVideoView
        ? "Video watch time"
        : isStreakView
          ? "Learning streak"
          : "Enrolled courses";

    return <div className="edc-analytics edc-analytics-detail">
      <button className="edc-analytics-back" type="button" onClick={() => setDetail("")}>
        <ArrowLeft size={17} /> Back to Learning Analytics
      </button>
      <header className="edc-analytics-head">
        <span>LEARNING ANALYTICS DETAILS</span>
        <h2>{title}</h2>
        <p>{isVideoView
          ? "Playback time from course videos recorded on this account."
          : isStreakView
            ? "A learning day counts when you watch at least one tracked video."
            : "Review your course progress and learning activity."}</p>
      </header>

      {isVideoView ? <>
        <section className="edc-analytics-detail-stats">
          <article><span>Total watch time</span><strong>{formatTime(activity.totalSeconds)}</strong></article>
          <article><span>This month</span><strong>{formatTime(monthlySeconds)}</strong></article>
          <article><span>Today</span><strong>{formatTime(days[today])}</strong></article>
        </section>
        <section className="edc-analytics-panel">
          <h3>Daily watch history</h3>
          {watchedDays.length ? <div className="edc-analytics-history">
            {watchedDays.map(([day, seconds]) => <div key={day}>
              <span><PlayCircle size={16} /> {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              <strong>{formatTime(seconds)}</strong>
            </div>)}
          </div> : <p>No video watch time has been recorded yet.</p>}
        </section>
      </> : isStreakView ? <>
        <section className="edc-streak-highlight">
          <Flame size={30} />
          <div><span>Current learning streak</span><strong>{streak} {streak === 1 ? "day" : "days"}</strong></div>
        </section>
        <section className="edc-analytics-panel">
          <h3>Recent learning days</h3>
          <p>Days with tracked video playback are marked as active.</p>
          <div className="edc-streak-days">
            {recentDays.slice().reverse().map(day => <div className={day.seconds > 0 ? "active" : ""} key={day.key}>
              <span>{new Date(`${day.key}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              <strong>{day.seconds > 0 ? "Active" : "No activity"}</strong>
            </div>)}
          </div>
        </section>
      </> : <section className="edc-analytics-panel">
        <h3>{isCompletedView ? "Courses completed" : "Your enrolled courses"}</h3>
        {detailCourses.length ? <div className="edc-analytics-course-list">
          {detailCourses.map(course => <article key={`${course.teacherEmail || "demo"}:${course.id}`}>
            <div className="edc-analytics-detail-course-heading">
              <div><span>{course.category || "Course"}</span><strong>{course.title}</strong><small>By {course.instructor || "EduConnect Instructor"}</small></div>
              {isCompletedView && <CheckCircle2 size={21} />}
            </div>
            <div className="edc-analytics-detail-course-meta">
              <span><BookOpen size={15} /> {course.completedLessons || 0} of {course.lessons || 0} lessons</span>
              <strong>{Math.round(Number(course.progress) || 0)}%</strong>
            </div>
            <div className="edc-analytics-track"><div style={{ width: `${Math.min(100, Math.max(0, Number(course.progress) || 0))}%` }} /></div>
          </article>)}
        </div> : <p>{isCompletedView ? "You have not completed a course yet." : "You are not enrolled in any courses yet."}</p>}
      </section>}
    </div>;
  }

  return <div className="edc-analytics">
    <header className="edc-analytics-head"><span>STUDENT LEARNING ANALYTICS</span><h2>Your Learning Activity</h2>
      <p>Actual HTML video playback is counted. YouTube embeds and time spent reading are not tracked.</p></header>
    <div className="edc-analytics-stats">
      <button type="button" onClick={() => setDetail("enrolled")} aria-label={`View ${courses.length} enrolled courses`}><span>Enrolled courses</span><strong>{courses.length}</strong></button>
      <button type="button" onClick={() => setDetail("completed")} aria-label={`View ${completed} completed courses`}><span>Completed courses</span><strong>{completed}</strong></button>
      <button type="button" onClick={() => setDetail("video")} aria-label={`View video watch time: ${formatTime(activity.totalSeconds)}`}><span>Video watch time</span><strong>{formatTime(activity.totalSeconds)}</strong></button>
      <button type="button" onClick={() => setDetail("streak")} aria-label={`View learning streak: ${streak} ${streak === 1 ? "day" : "days"}`}><span>Learning streak</span><strong>{streak} {streak === 1 ? "day" : "days"}</strong></button>
    </div>
    <div className="edc-analytics-grid">
      <section className="edc-analytics-panel"><h3>Last 7 days</h3><p>Actual video watch time</p>
        <div className="edc-analytics-bars">{recentDays.map(day => <div key={day.key} className="edc-analytics-day" title={`${day.key}: ${Math.round(day.seconds)} seconds`}>
          <span className="edc-analytics-bar-area"><span className="edc-analytics-bar" style={{height: `${day.seconds ? Math.max(4, day.seconds / maxSeconds * 100) : 0}%`}} /></span>
          <small>{day.label}</small><small>{Math.round(day.seconds / 60)}m</small>
        </div>)}</div>
      </section>
      <section className="edc-analytics-panel"><h3>Monthly summary</h3>
        <div className="edc-analytics-summary"><span>This month's video time</span><strong>{formatTime(monthlySeconds)}</strong></div>
        <div className="edc-analytics-summary"><span>Lessons completed</span><strong>{completedLessons} / {totalLessons}</strong></div>
        <div className="edc-analytics-summary"><span>Overall lesson progress</span><strong>{totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0}%</strong></div>
      </section>
    </div>
    <section className="edc-analytics-panel"><h3>Course progress</h3>
      {courses.length ? courses.map(c => <div className="edc-analytics-course" key={`${c.teacherEmail || "demo"}:${c.id}`}>
        <div><strong>{c.title}</strong><span>{Math.round(Number(c.progress) || 0)}%</span></div>
        <div className="edc-analytics-track"><div style={{width: `${Math.min(100, Math.max(0, Number(c.progress) || 0))}%`}} /></div>
      </div>) : <p>No enrolled courses yet.</p>}
    </section>
    <section className="edc-analytics-panel"><h3>Learning milestones</h3><div className="edc-analytics-badges">
      {milestones.map(m => <article key={m.title} className={m.earned ? "earned" : ""}><span>{m.earned ? "🏆" : "🔒"}</span><strong>{m.title}</strong><small>{m.detail}</small></article>)}
    </div><p className="edc-analytics-disclaimer">Demo achievements only; not accredited qualifications.</p></section>
  </div>;
}
