import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Code2, Heart, ListChecks, PencilLine, Play, Star, Target, Trophy, UserRound } from "lucide-react";
import { assignmentKey, submissionKey, read } from "../assignments/assignmentStorage";
import { getCourseReviewSummaries, getRelatedPublishedCourses, isAcademicProfileComplete } from "../../utils/studentRecommendations";
import { getReviews } from "../../utils/courseReviews";
import welcomeArtwork from "../../assets/student-welcome.svg";
import reactLogo from "../../assets/partners/react.svg";
import pythonLogo from "../../assets/partners/python.svg";
import figmaLogo from "../../assets/partners/figma.svg";
import "./StudentOverview.css";

const courseKey = course => `${String(course.teacherEmail || "demo").toLowerCase()}::${course.id}`;
const safeRead = key => { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };

function CourseArtwork({ course, large = false }) {
  const title = `${course.title} ${course.category}`.toLowerCase();
  const logo = title.includes("react") ? reactLogo : title.includes("python") ? pythonLogo : /design|figma|ui\/ux/.test(title) ? figmaLogo : null;
  return <div className={`edc-ov-course-art${large ? " edc-ov-course-art-large" : ""}`}>
    {course.thumbnail || course.image ? <img className="edc-ov-course-photo" src={course.thumbnail || course.image} alt=""/> : logo ? <img className="edc-ov-course-logo" src={logo} alt=""/> : <Code2 size={large ? 48 : 38} strokeWidth={1.6}/>}
    {large && <span className="edc-ov-video-mark"><Play size={11} fill="currentColor"/></span>}
  </div>;
}

export default function StudentOverview({ email, profile, courses, publishedCourses, demoCourses, activity, dailyGoals, goalProgress, wishlist, legacyTasks, legacyQuizPasses, legacySubmissions, onNavigate, onResume, onExplore, onCourseAction, onToggleWishlist, onMetric }) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const events = ["storage", "focus", "educonnect:assignments-updated", "educonnect:quizzes-updated", "educonnect:reviews-changed"];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  }, []);
  const records = useMemo(() => {
    const tasks = [...legacyTasks];
    let submitted = legacySubmissions;
    let passed = legacyQuizPasses;
    courses.forEach(course => {
      read(assignmentKey(course.teacherEmail, course.id)).filter(item => item.published).forEach(item => {
        const submissions = read(submissionKey(email, item.id));
        if (submissions.length) submitted++;
        else tasks.push({ id: `assignment:${item.id}`, title: item.title, dueAt: item.dueAt, tab: "course-assignments", type: "assignment" });
      });
      const quizKey = `educonnect.quiz.v1.${encodeURIComponent(String(course.teacherEmail || "").trim().toLowerCase())}.${encodeURIComponent(String(course.id))}`;
      safeRead(quizKey).filter(item => item.published).forEach(quiz => {
        const attempts = safeRead(`educonnect.quizAttempt.v1.${encodeURIComponent(email.trim().toLowerCase())}.${encodeURIComponent(quiz.id)}`);
        if (attempts.some(attempt => Number(attempt.percentage) >= Number(quiz.passingScore || 60))) passed++;
        if (!attempts.length) tasks.push({ id: `quiz:${quiz.id}`, title: quiz.title, dueAt: quiz.dueAt, tab: "quizzes", type: "quiz" });
      });
    });
    tasks.sort((a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity));
    return { tasks, submitted, passed };
  }, [courses, email, legacyTasks, legacySubmissions, legacyQuizPasses, revision]);
  const completed = courses.filter(course => course.progress === 100).length;
  const inProgress = courses.filter(course => course.progress > 0 && course.progress < 100).length;
  const notStarted = courses.length - completed - inProgress;
  const progress = courses.length ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length) : 0;
  const nextCourse = courses.find(course => course.progress > 0 && course.progress < 100) || courses.find(course => course.progress < 100) || courses[0];
  const featuredCourse = nextCourse && { ...publishedCourses.find(course => courseKey(course) === courseKey(nextCourse)), ...nextCourse };
  const recommendations = useMemo(() => {
    if (!publishedCourses.length) return demoCourses.slice(0, 3);
    const available = isAcademicProfileComplete(profile) ? getRelatedPublishedCourses(publishedCourses, profile) : publishedCourses;
    const unenrolled = available.filter(course => !courses.some(enrolled => courseKey(enrolled) === courseKey(course)));
    return (unenrolled.length ? unenrolled : available).slice(0, 3);
  }, [publishedCourses, profile, courses, demoCourses]);
  const reviewSummaries = getCourseReviewSummaries(recommendations, getReviews());
  const hours = (Math.max(0, Number(activity.totalSeconds) || 0) / 3600).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const learningGoal = dailyGoals.find(goal => !goal.done)?.title || dailyGoals[0]?.title || "Build a new skill";
  const tasks = records.tasks.length ? records.tasks : dailyGoals.filter(goal => !goal.done).map(goal => ({ id: `goal:${goal.id}`, title: goal.title, type: "goal", tab: "planner" }));
  const achievements = [
    { title: "First Course Enrolled", icon: Award, color: "violet", earned: courses.length > 0 },
    { title: "Quiz Master", icon: Star, color: "gold", earned: records.passed > 0 },
    { title: "Assignment Submitted", icon: ClipboardCheck, color: "blue", earned: records.submitted > 0 },
  ];

  return <div className="edc-overview">
    <section className="edc-ov-welcome">
      <div className="edc-ov-welcome-copy"><h2>Welcome Back,<br/>{profile.fullName?.trim() || "Student"} <span>👋</span></h2><p>Keep learning, keep growing, and achieve your goals<br className="edc-ov-desktop-break"/> with EduConnect AI.</p></div>
      <img className="edc-ov-welcome-art" src={welcomeArtwork} alt=""/>
      <div className="edc-ov-learning-goal"><div className="edc-ov-goal-title"><Target size={24}/><div><span>Your Learning Goal</span><strong>{learningGoal}</strong></div></div><div className="edc-ov-goal-progress"><div><span style={{ width: `${goalProgress}%` }}/></div><strong>{goalProgress}%</strong></div><button type="button" onClick={() => onNavigate("planner")}><PencilLine size={14}/> Edit Goal</button></div>
    </section>
    <section className="edc-ov-stats" aria-label="Learning summary">
      {[{ title: "Enrolled Courses", value: courses.length, icon: BookOpen, color: "violet", action: () => onMetric("enrolled-courses") }, { title: "In Progress", value: inProgress, icon: Play, color: "amber", action: () => onNavigate("learning") }, { title: "Completed", value: completed, icon: CheckCircle2, color: "green", action: () => onMetric("completed-courses") }, { title: "Learning Hours", value: `${hours} hrs`, icon: Clock3, color: "violet", action: () => onNavigate("analytics") }].map(stat => <button type="button" key={stat.title} className={`edc-ov-stat ${stat.color}`} onClick={stat.action}><span className="edc-ov-stat-icon"><stat.icon size={25} strokeWidth={1.8}/></span><span><small>{stat.title}</small><strong>{stat.value}</strong></span></button>)}
    </section>
    <div className="edc-ov-middle-grid">
      <section className="edc-ov-panel edc-ov-progress"><h3><ChartIcon/> Learning Progress</h3><div className="edc-ov-progress-body"><button type="button" className="edc-ov-donut" style={{ "--progress": `${progress}%` }} onClick={() => onNavigate("analytics")} aria-label={`Overall progress ${progress} percent. Open learning analytics.`}><span><strong>{progress}%</strong><small>Overall<br/>Progress</small></span></button><div className="edc-ov-progress-legend">{[{ label: "Completed", count: completed, color: "completed" }, { label: "In Progress", count: inProgress, color: "in-progress" }, { label: "Not Started", count: notStarted, color: "not-started" }].map(item => <div key={item.label}><i className={item.color}/><span>{item.label}</span><strong>{item.count} <small>({courses.length ? Math.round(item.count / courses.length * 100) : 0}%)</small></strong></div>)}</div></div></section>
      <section className="edc-ov-panel edc-ov-continue"><h3><ClipboardCheck size={18}/> Continue Learning</h3>{featuredCourse ? <div className="edc-ov-continue-body"><button className="edc-ov-resume-cover" type="button" onClick={() => onResume(featuredCourse.id)} aria-label={`Continue ${featuredCourse.title}`}><CourseArtwork course={featuredCourse} large/></button><div className="edc-ov-continue-copy"><h4>{featuredCourse.title}</h4><p>Lessons {featuredCourse.completedLessons} of {featuredCourse.lessons}</p><div className="edc-ov-inline-progress"><div><span style={{ width: `${featuredCourse.progress}%` }}/></div><strong>{featuredCourse.progress}%</strong></div><button className="edc-ov-primary" type="button" onClick={() => onResume(featuredCourse.id)} disabled={!featuredCourse.lessons}><Play size={13} fill="currentColor"/> {featuredCourse.progress === 100 ? "Review Course" : "Continue Learning"}</button></div></div> : <div className="edc-ov-empty"><BookOpen size={28}/><strong>Start your learning journey</strong><p>Choose a course and take your first lesson.</p><button type="button" className="edc-ov-primary" onClick={onExplore}>Explore Courses <ArrowRight size={13}/></button></div>}</section>
      <section className="edc-ov-panel edc-ov-tasks"><div className="edc-ov-panel-heading"><h3><CalendarDays size={18}/> Upcoming Tasks</h3><button type="button" onClick={() => onNavigate("planner")}>View All <ArrowRight size={13}/></button></div><div className="edc-ov-task-list">{tasks.slice(0, 3).map(task => <button type="button" key={task.id} onClick={() => onNavigate(task.tab)}><span className="edc-ov-task-icon">{task.type === "quiz" ? <ListChecks size={18}/> : task.type === "goal" ? <Target size={18}/> : <CalendarDays size={18}/>}</span><span><strong>{task.title}</strong><small className={task.dueAt ? "has-due-date" : ""}>{task.dueAt ? `Due: ${new Date(task.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : task.type === "goal" ? "Daily learning goal" : "Ready when you are"}</small></span><ChevronRight size={14}/></button>)}{!tasks.length && <div className="edc-ov-empty"><CheckCircle2 size={26}/><strong>You're all caught up!</strong><p>Your upcoming course tasks will appear here.</p></div>}</div></section>
    </div>
    <div className="edc-ov-bottom-grid">
      <section className="edc-ov-panel edc-ov-recommendations"><div className="edc-ov-panel-heading"><h3><Star size={18}/> Recommended for You</h3><button type="button" onClick={onExplore}>View All Courses <ArrowRight size={13}/></button></div><div className="edc-ov-recommendation-grid">{recommendations.map(course => { const review = reviewSummaries.get(`${String(course.teacherEmail || "").toLowerCase()}::${course.id}`); const enrolled = courses.some(item => courseKey(item) === courseKey(course)); const saved = wishlist.includes(course.id); return <article className="edc-ov-recommendation" key={courseKey(course)}><div className="edc-ov-recommendation-art"><CourseArtwork course={course}/><span className={`edc-ov-course-label ${course.teacherEmail ? Number(course.price) > 0 ? "premium" : "free" : "demo"}`}>{course.teacherEmail ? Number(course.price) > 0 ? "Course" : "Free" : "Demo"}</span><button type="button" className={`edc-ov-wishlist ${saved ? "is-saved" : ""}`} aria-label={`${saved ? "Remove" : "Add"} ${course.title} ${saved ? "from" : "to"} wishlist`} onClick={() => onToggleWishlist(course.id)}><Heart size={15} fill={saved ? "currentColor" : "none"}/></button></div><h4>{course.title}</h4><p className="edc-ov-instructor"><UserRound size={11}/>{course.instructorName || course.instructor || "EduConnect Instructor"}</p><p className="edc-ov-course-rating">{review?.rating ? <><Star size={11} fill="currentColor"/>{review.rating.toFixed(1)} <span>({review.reviewCount})</span></> : <span>No reviews yet</span>}</p><strong className="edc-ov-price">{Number(course.price) > 0 ? `PKR ${Number(course.price).toLocaleString()}` : "Free"}</strong><button type="button" className="edc-ov-primary edc-ov-enroll" onClick={() => onCourseAction(course)}>{enrolled ? "Go to Learning" : Number(course.price) > 0 ? "Add to Cart" : "Enroll Now"}</button></article>; })}{!recommendations.length && <div className="edc-ov-empty"><BookOpen size={28}/><strong>No matching courses yet</strong><p>Explore the course catalog or update your education profile.</p><button type="button" className="edc-ov-primary" onClick={onExplore}>Explore Courses</button></div>}</div></section>
      <section className="edc-ov-panel edc-ov-achievements"><div className="edc-ov-panel-heading"><h3><Trophy size={19}/> My Achievements</h3><button type="button" onClick={() => onNavigate("portfolio")}>View All <ArrowRight size={13}/></button></div><div className="edc-ov-achievement-grid">{achievements.map(item => <button type="button" key={item.title} className={`edc-ov-achievement edc-ov-achievement-${item.color}${item.earned ? " earned" : ""}`} onClick={() => onNavigate("portfolio")}><span className="edc-ov-medal"><span><item.icon size={29} strokeWidth={1.7}/></span></span><strong>{item.title}</strong><small>{item.earned ? "Earned" : "Not earned yet"}</small></button>)}</div></section>
    </div>
  </div>;
}

function ChartIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 16V11H6V16H3ZM8.5 16V6H11.5V16H8.5ZM14 16V2H17V16H14Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
