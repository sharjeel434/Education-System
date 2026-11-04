
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  MessageCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  Plus,
  Send,
  Trash2,
  Users,
  Wallet,
  ChartNoAxesCombined,
  ListChecks,
  ClipboardList,
  ListTree,
  X,
  Menu,
  Layers3,
  ArrowRight,
  UserRound,
  LogOut,
} from "lucide-react";

import { lessonVideoKey, saveLessonVideo, deleteLessonVideo } from "../../utils/lessonVideos";
import CourseReviews from "../../components/reviews/CourseReviews";
import CourseDiscussions from "../../components/discussions/CourseDiscussions";
import InstructorAnalytics from "../../components/analytics/InstructorAnalytics";
import CourseQuizzes from "../../components/quizzes/CourseQuizzes";
import CourseAssignments from "../../components/assignments/CourseAssignments";
import CurriculumBuilder from "../../components/curriculum/CurriculumBuilder";

const purple = "#6d28d9";

const styles = {
  panel: {
    padding: 20,
    border: "1px solid #e9e5f5",
    borderRadius: 16,
    background: "#fff",
  },
  button: {
    padding: "10px 15px",
    border: 0,
    borderRadius: 9,
    background: purple,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  lightButton: {
    padding: "10px 15px",
    border: 0,
    borderRadius: 9,
    background: "#f3edff",
    color: purple,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  input: {
    width: "100%",
    padding: 12,
    border: "1px solid #ddd6fe",
    borderRadius: 9,
    font: "inherit",
    boxSizing: "border-box",
  },
};

function readSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}


const emptyCourse = {
  title: "",
  category: "Development",
  level: "Beginner",
  description: "",
  price: "",
  thumbnail: "",
};  


const navigation = [
  ["overview", "Overview", GraduationCap],
  ["courses", "My Courses", BookOpen],
  ["reviews", "Course Reviews", GraduationCap],
  ["discussions", "Course Q&A", MessageCircle],
  ["lessons", "Lessons", Layers3],
  ["students", "My Students", Users],
  ["earnings", "Earnings", Wallet],
  ["analytics", "Learning Analytics & Sales", ChartNoAxesCombined],
  ["quizzes", "Course Quizzes", ListChecks],
  ["course-assignments", "Course Assignments", ClipboardList],
  ["curriculum", "Curriculum Builder", ListTree],
  ["profile", "My Profile", UserRound],
];

function TeacherDashboard({ email = "teacher@example.com" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const courseKey = `educonnect.teacher.${email}.courses`;
  const profileKey = `educonnect.teacher.${email}.profile`;

  function signOut() {
    window.sessionStorage.removeItem("educonnect.demoEmail");
    window.sessionStorage.removeItem("educonnect.demoRole");
    navigate("/login", { replace: true });
  }

  const [courses, setCourses] = useState(() =>
    readSaved(courseKey, [])
  );

  const [profile, setProfile] = useState(() =>
    readSaved(profileKey, {
      name: email.split("@")[0],
      headline: "",
      bio: "",
    })
  );

  const [tab, setTab] = useState(() =>
    location.pathname.startsWith("/teacher/dashboard/students/")
      ? "students"
      : location.pathname.startsWith("/teacher/dashboard/earnings/")
        ? "earnings"
        : "overview"
  );
  
const [earningsPeriod, setEarningsPeriod] = useState("6months");
const [transactionSearch, setTransactionSearch] = useState("");
const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
const [withdrawalAmount, setWithdrawalAmount] = useState("");
const [demoWithdrawalRequests, setDemoWithdrawalRequests] = useState([]);

const demoRevenue = [
  { month: "Jun", revenue: 12000 },
  { month: "Jul", revenue: 18500 },
  { month: "Aug", revenue: 15000 },
  { month: "Sep", revenue: 27000 },
  { month: "Oct", revenue: 32000 },
  { month: "Nov", revenue: 24500 },
];

const demoTransactions = [
  {
    id: "TXN-1001",
    student: "Ali Ahmed",
    course: "React Developer Course",
    date: "2026-11-01",
    amount: 2500,
    status: "Completed",
  },
  {
    id: "TXN-1002",
    student: "Ayesha Khan",
    course: "React Developer Course",
    date: "2026-10-28",
    amount: 2500,
    status: "Completed",
  },
  {
    id: "TXN-1003",
    student: "Hamza Malik",
    course: "Python for Beginners",
    date: "2026-10-25",
    amount: 3000,
    status: "Completed",
  },
  {
    id: "TXN-1004",
    student: "Fatima Noor",
    course: "UI UX Design",
    date: "2026-10-20",
    amount: 2000,
    status: "Pending",
  },
  {
    id: "TXN-1005",
    student: "Usman Khan",
    course: "React Developer Course",
    date: "2026-10-15",
    amount: 2500,
    status: "Completed",
  },
];

const filteredTransactions = demoTransactions.filter((transaction) => {
  const search = transactionSearch.toLowerCase().trim();

  return (
    transaction.student.toLowerCase().includes(search) ||
    transaction.course.toLowerCase().includes(search) ||
    transaction.id.toLowerCase().includes(search)
  );
});

const totalDemoEarnings = demoRevenue.reduce(
  (total, item) => total + item.revenue,
  0
);

const demoMonthlyEarnings = demoRevenue[demoRevenue.length - 1].revenue;

const demoCompletedSales = demoTransactions.filter(
  (transaction) => transaction.status === "Completed"
).length;

const demoChartData =
  earningsPeriod === "3months"
    ? demoRevenue.slice(-3)
    : demoRevenue;

  
const [studentSearch, setStudentSearch] = useState("");
const [studentCourseFilter, setStudentCourseFilter] = useState("All");
const [selectedStudent, setSelectedStudent] = useState(null);

const demoStudents = [
  {
    id: 1,
    name: "Ali Ahmed",
    email: "ali.demo@example.com",
    courseTitle: "React Developer Course",
    enrolledAt: "2026-10-10",
    progress: 75,
    completedLessons: 9,
    totalLessons: 12,
  },
  {
    id: 2,
    name: "Ayesha Khan",
    email: "ayesha.demo@example.com",
    courseTitle: "React Developer Course",
    enrolledAt: "2026-10-15",
    progress: 45,
    completedLessons: 5,
    totalLessons: 11,
  },
  {
    id: 3,
    name: "Hamza Malik",
    email: "hamza.demo@example.com",
    courseTitle: "Python for Beginners",
    enrolledAt: "2026-10-20",
    progress: 90,
    completedLessons: 9,
    totalLessons: 10,
  },
  {
    id: 4,
    name: "Fatima Noor",
    email: "fatima.demo@example.com",
    courseTitle: "UI UX Design",
    enrolledAt: "2026-10-25",
    progress: 30,
    completedLessons: 3,
    totalLessons: 10,
  },
];

const studentCourses = [
  ...new Set(demoStudents.map((student) => student.courseTitle)),
];

const filteredStudents = demoStudents.filter((student) => {
  const search = studentSearch.toLowerCase().trim();

  const matchesSearch =
    student.name.toLowerCase().includes(search) ||
    student.email.toLowerCase().includes(search);

  const matchesCourse =
    studentCourseFilter === "All" ||
    student.courseTitle === studentCourseFilter;

  return matchesSearch && matchesCourse;
});

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [courseForm, setCourseForm] = useState({ ...emptyCourse });
  const [lessonInputs, setLessonInputs] = useState({});
  
const [selectedLessonCourse, setSelectedLessonCourse] = useState("");
const [editingLessonId, setEditingLessonId] = useState(null);
const [showLessonForm, setShowLessonForm] = useState(false);
const [lessonVideoFile, setLessonVideoFile] = useState(null);

const [lessonForm, setLessonForm] = useState({
  title: "",
  description: "",
  duration: "",
  isFreePreview: false,
});

  const [profileSaved, setProfileSaved] = useState(false);
  
const [previewCourse, setPreviewCourse] = useState(null);

const [courseSearch, setCourseSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("All");
const [statusFilter, setStatusFilter] = useState("All");

const filteredCourses = courses.filter((course) => {
  const matchesSearch = (course.title || "")
    .toLowerCase()
    .includes(courseSearch.toLowerCase().trim());

  const matchesCategory =
    categoryFilter === "All" ||
    course.category === categoryFilter;

  const matchesStatus =
    statusFilter === "All" ||
    (course.status || "Draft") === statusFilter;

  return matchesSearch && matchesCategory && matchesStatus;
});

  useEffect(() => {
    localStorage.setItem(courseKey, JSON.stringify(courses));
    window.dispatchEvent(new Event("educonnect:teacher-courses-changed"));
  }, [courses, courseKey]);


  const totalCourses = courses.length;

  const draftCount = courses.filter(
    (course) => (course.status || "Draft") === "Draft"
  ).length;

  const pendingCount = courses.filter(
    (course) => course.status === "Pending Approval"
  ).length;

  const approvedCount = courses.filter(
    (course) => course.status === "Approved"
  ).length;

  const totalLessons = courses.reduce(
    (total, course) => total + (course.lessons || []).length,
    0
  );

  const recentCourses = [...courses]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  function navigateTo(nextTab) {
    setTab(nextTab);
    setMobileMenuOpen(false);
    if (location.pathname !== "/teacher/dashboard") {
      navigate("/teacher/dashboard");
    }
  }

  function startCreate() {
    setEditingId(null);
    setCourseForm({ ...emptyCourse });
    setShowForm(true);
    navigateTo("courses");
  }

  function startEdit(course) {
    setEditingId(course.id);
    setCourseForm({
      title: course.title || "",
      category: course.category || "Development",
      level: course.level || "Beginner",
      description: course.description || "",
      price: String(course.price ?? ""),
      thumbnail: course.thumbnail || "",

    });
    setShowForm(true);
    navigateTo("courses");
  }
  
function handleThumbnailUpload(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    alert("Please select a JPG, PNG or WebP image.");
    event.target.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    alert("Image must be smaller than 1 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setCourseForm((previous) => ({
      ...previous,
      thumbnail: String(reader.result),
    }));
  };

  reader.onerror = () => {
    alert("Unable to read the image. Please try again.");
  };

  reader.readAsDataURL(file);
  event.target.value = "";
}

function removeThumbnail() {
  setCourseForm((previous) => ({
    ...previous,
    thumbnail: "",
  }));
}

  function saveCourse(event) {
    event.preventDefault();

    const title = courseForm.title.trim();
    const description = courseForm.description.trim();
    const price = Number(courseForm.price);

    if (!title || !description) {
      alert("Course title and description are required.");
      return;
    }

    if (
      courseForm.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      alert("Enter a valid course price.");
      return;
    }

    if (editingId) {
      setCourses((previous) =>
        previous.map((course) =>
          course.id === editingId
            ? {
                ...course,
                ...courseForm,
                title,
                description,
                price,
                status: "Draft",
              }
            : course
        )
      );
    } else {
      const id =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;

      setCourses((previous) => [
        ...previous,
        {
          id,
          ...courseForm,
          title,
          description,
          price,
          status: "Draft",
          lessons: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    setShowForm(false);
    setEditingId(null);
    setCourseForm({ ...emptyCourse });
  }

  function deleteCourse(id) {
    if (!window.confirm("Delete this course?")) return;
    const oldCourse = courses.find((item) => item.id === id);
    (oldCourse?.lessons || []).forEach((lesson) => {
      deleteLessonVideo(lessonVideoKey(email, id, lesson.id)).catch(console.error);
    });

    setCourses((previous) =>
      previous.filter((course) => course.id !== id)
    );
  }

  function addLesson(courseId) {
    const title = (lessonInputs[courseId] || "").trim();

    if (!title) {
      alert("Please enter a lesson title.");
      return;
    }

    const lessonId =
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`;

    setCourses((previous) =>
      previous.map((course) =>
        course.id === courseId
          ? {
              ...course,
              status: "Draft",
              lessons: [
                ...(course.lessons || []),
                { id: lessonId, title },
              ],
            }
          : course
      )
    );

    setLessonInputs((previous) => ({
      ...previous,
      [courseId]: "",
    }));
  }

  function removeLesson(courseId, lessonId) {
    if (!window.confirm("Remove this lesson?")) return;
    deleteLessonVideo(lessonVideoKey(email, courseId, lessonId)).catch(console.error);

    setCourses((previous) =>
      previous.map((course) =>
        course.id === courseId
          ? {
              ...course,
              status: "Draft",
              lessons: (course.lessons || []).filter(
                (lesson) => lesson.id !== lessonId
              ),
            }
          : course
      )
    );
  }

function openLessonForm(courseId, lesson = null) {
  setSelectedLessonCourse(courseId);
  setEditingLessonId(lesson?.id ?? null);
  setLessonVideoFile(null);

  setLessonForm({
    title: lesson?.title || "",
    description: lesson?.description || "",
    duration: lesson?.duration || "",
    isFreePreview: Boolean(lesson?.isFreePreview),
  });

  setShowLessonForm(true);
}

function closeLessonForm() {
  setShowLessonForm(false);
  setEditingLessonId(null);
  setLessonVideoFile(null);
}

async function saveLesson(event) {
  event.preventDefault();

  const title = lessonForm.title.trim();

  if (!title || !selectedLessonCourse) {
    alert("Please enter a lesson title.");
    return;
  }

  const newLessonId = editingLessonId !== null
    ? editingLessonId
    : (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  if (lessonVideoFile) {
    try {
      await saveLessonVideo(lessonVideoKey(email, selectedLessonCourse, newLessonId), lessonVideoFile);
    } catch (error) {
      alert(`Video could not be saved: ${error.message}. Try a smaller file or free browser storage.`);
      return;
    }
  }

  setCourses((previous) =>
    previous.map((course) => {
      if (course.id !== selectedLessonCourse) {
        return course;
      }

      const lessons = [...(course.lessons || [])];

      const updatedLesson = {
        title,
        description: lessonForm.description.trim(),
        duration: lessonForm.duration,
        isFreePreview: lessonForm.isFreePreview,
        ...(lessonVideoFile ? { hasLocalVideo: true } : {}),
      };

      if (editingLessonId !== null) {
        return {
          ...course,
          lessons: lessons.map((lesson) =>
            lesson.id === editingLessonId
              ? { ...lesson, ...updatedLesson }
              : lesson
          ),
        };
      }

      return {
        ...course,
        lessons: [
          ...lessons,
          {
            id: newLessonId,
            ...updatedLesson,
          },
        ],
      };
    })
  );

  closeLessonForm();
}

function moveLesson(courseId, lessonId, direction) {
  setCourses((previous) =>
    previous.map((course) => {
      if (course.id !== courseId) return course;
      const lessons = [...(course.lessons || [])];
      const index = lessons.findIndex((lesson) => lesson.id === lessonId);
      const newIndex = index + direction;
      if (index === -1 || newIndex < 0 || newIndex >= lessons.length) {
        return course;
      }
      [lessons[index], lessons[newIndex]] = [lessons[newIndex], lessons[index]];
      return { ...course, lessons, status: "Draft" };
    })
  );
}

const teacherProfileImage = profile.avatar || "";
const teacherExpertise = profile.expertise || "";
const teacherDisplayName = profile.name || "Instructor";

function handleTeacherProfileImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    alert("Only JPG, PNG or WebP images allowed.");
    event.target.value = "";
    return;
  }
  if (file.size > 1024 * 1024) {
    alert("Image must be smaller than 1MB.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    setProfile((previous) => ({ ...previous, avatar: String(reader.result) }));
    setProfileSaved(false);
  };
  reader.onerror = () => alert("Unable to read image.");
  reader.readAsDataURL(file);
  event.target.value = "";
}

function handleDemoWithdrawal(event) {
  event.preventDefault();

  const amount = Number(withdrawalAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (amount > totalDemoEarnings) {
    alert("Amount exceeds the demo earnings balance.");
    return;
  }

  setDemoWithdrawalRequests((previous) => [
    {
      id: `DEMO-${Date.now()}`,
      amount,
      status: "Demo Pending",
      date: new Date().toLocaleDateString(),
    },
    ...previous,
  ]);

  setWithdrawalAmount("");
  setShowWithdrawalForm(false);
}

  function submitForApproval(courseId) {
    const course = courses.find(
      (item) => item.id === courseId
    );

    if (!course) return;

    if (!(course.lessons || []).length) {
      alert("Add at least one lesson before submission.");
      navigateTo("lessons");
      return;
    }

    setCourses((previous) =>
      previous.map((item) =>
        item.id === courseId
          ? { ...item, status: "Pending Approval" }
          : item
      )
    );

    alert("Course marked as Pending Approval in this demo.");
  }

  const statCards = [
    {
      label: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
    },
    {
      label: "Draft Courses",
      value: draftCount,
      icon: Edit3,
    },
    {
      label: "Pending Approval",
      value: pendingCount,
      icon: Clock3,
    },
    {
      label: "Approved Courses",
      value: approvedCount,
      icon: CheckCircle2,
    },
  ];

  const teacherStatDetailSlug = location.pathname.startsWith("/teacher/dashboard/overview/")
    ? location.pathname.split("/").at(-1)
    : "";
  const teacherStatDetailConfig = {
    "total-courses": {
      title: "Total Courses",
      description: "All courses in your teaching workspace.",
      courses,
      emptyMessage: "You have not created any courses yet.",
    },
    "draft-courses": {
      title: "Draft Courses",
      description: "Courses saved as drafts and not submitted for approval.",
      courses: courses.filter((course) => (course.status || "Draft") === "Draft"),
      emptyMessage: "You have no draft courses.",
    },
    "pending-approval": {
      title: "Pending Approval",
      description: "Courses waiting for an administrator to review them.",
      courses: courses.filter((course) => course.status === "Pending Approval"),
      emptyMessage: "You have no courses waiting for approval.",
    },
    "approved-courses": {
      title: "Approved Courses",
      description: "Courses approved and ready for learners.",
      courses: courses.filter((course) => course.status === "Approved"),
      emptyMessage: "You have no approved courses yet.",
    },
  }[teacherStatDetailSlug];

  const teacherStudentDetailSlug = location.pathname.startsWith("/teacher/dashboard/students/")
    ? location.pathname.split("/").at(-1)
    : "";
  const teacherStudentDetailConfig = {
    "total-students": {
      title: "Total Demo Students",
      description: "Student enrollment records shown in this frontend demo.",
      items: demoStudents.map((student) => ({
        id: student.id,
        title: student.name,
        detail: `${student.email} · ${student.courseTitle} · Enrolled ${student.enrolledAt}`,
        status: `${student.progress}% progress`,
        progress: student.progress,
      })),
      emptyMessage: "No demo student records are available.",
    },
    "demo-courses": {
      title: "Demo Courses",
      description: "Courses with sample student enrollments and progress.",
      items: studentCourses.map((courseTitle) => {
        const enrolledStudents = demoStudents.filter((student) => student.courseTitle === courseTitle);
        const averageCourseProgress = enrolledStudents.length
          ? Math.round(enrolledStudents.reduce((total, student) => total + student.progress, 0) / enrolledStudents.length)
          : 0;
        return {
          id: courseTitle,
          title: courseTitle,
          detail: enrolledStudents.map((student) => `${student.name} (${student.progress}%)`).join(" · "),
          status: `${enrolledStudents.length} ${enrolledStudents.length === 1 ? "student" : "students"}`,
          progress: averageCourseProgress,
        };
      }),
      emptyMessage: "No demo courses have student enrollments.",
    },
    "average-progress": {
      title: "Average Demo Progress",
      description: `Average learning progress across all demo enrollments is ${demoStudents.length ? Math.round(demoStudents.reduce((total, student) => total + student.progress, 0) / demoStudents.length) : 0}%. Individual progress is listed below.`,
      items: [...demoStudents].sort((a, b) => a.progress - b.progress).map((student) => ({
        id: student.id,
        title: student.name,
        detail: `${student.courseTitle} · ${student.completedLessons} of ${student.totalLessons} lessons completed`,
        status: `${student.progress}%`,
        progress: student.progress,
      })),
      emptyMessage: "No demo progress records are available.",
    },
  }[teacherStudentDetailSlug];

  const teacherEarningsDetailSlug = location.pathname.startsWith("/teacher/dashboard/earnings/")
    ? location.pathname.split("/").at(-1)
    : "";
  const teacherEarningsDetailConfig = {
    "total-earnings": {
      title: "Total Demo Earnings",
      description: "Sample revenue by month. The monthly revenue figures are demo data and are not calculated from the sample transactions.",
      items: demoRevenue.map((month) => ({
        id: month.month,
        title: `${month.month} 2026`,
        detail: "Sample monthly revenue",
        amount: month.revenue,
        status: "Demo revenue",
      })),
      emptyMessage: "No sample revenue data is available.",
    },
    "monthly-earnings": {
      title: "November Demo Earnings",
      description: "Sample November revenue and transactions recorded for November.",
      items: [
        {
          id: "november-revenue",
          title: "November sample revenue",
          detail: "Monthly demo revenue figure",
          amount: demoMonthlyEarnings,
          status: "Demo revenue",
        },
        ...demoTransactions.filter((transaction) => transaction.date.startsWith("2026-11")).map((transaction) => ({
          id: transaction.id,
          title: transaction.id,
          detail: `${transaction.student} · ${transaction.course} · ${transaction.date}`,
          amount: transaction.amount,
          status: transaction.status,
        })),
      ],
      emptyMessage: "No November earnings data is available.",
    },
    "completed-sales": {
      title: "Demo Completed Sales",
      description: `${demoCompletedSales} completed sample transactions. These are fictional sales for this frontend demo.`,
      items: demoTransactions.filter((transaction) => transaction.status === "Completed").map((transaction) => ({
        id: transaction.id,
        title: transaction.id,
        detail: `${transaction.student} · ${transaction.course} · ${transaction.date}`,
        amount: transaction.amount,
        status: transaction.status,
      })),
      emptyMessage: "There are no completed demo sales.",
    },
  }[teacherEarningsDetailSlug];

  return (
    <section className="edc-teacher-shell">
      {/* MOBILE MENU */}

      <button
        type="button"
        className="edc-teacher-mobile-toggle"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={20} />
        Menu
      </button>

      {mobileMenuOpen && (
        <button
          type="button"
          className="edc-teacher-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`edc-teacher-sidebar ${
          mobileMenuOpen ? "edc-teacher-sidebar-open" : ""
        }`}
      >
        <div className="edc-teacher-brand">
          <div className="edc-teacher-brand-icon">
            <GraduationCap size={23} />
          </div>

          <div>
            <strong>EduConnect AI</strong>
            <span>Teacher Workspace</span>
          </div>

          <button
            type="button"
            className="edc-teacher-close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="edc-teacher-user">
          <div className="edc-teacher-avatar">
            {teacherProfileImage ? (
              <img src={teacherProfileImage} alt="Instructor" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              (profile.name || "T").charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <strong>{profile.name || "Instructor"}</strong>
            <span style={{ overflowWrap: "anywhere" }}>
              {email}
            </span>
          </div>
        </div>

        <span className="edc-teacher-menu-label">
          MANAGEMENT
        </span>

        <nav
          className="edc-teacher-nav"
          aria-label="Teacher navigation"
        >
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={`edc-teacher-nav-item ${
                tab === id ? "active" : ""
              }`}
              onClick={() => navigateTo(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* MAIN CONTENT */}

      <main className="edc-teacher-main">
        <header className="edc-teacher-topbar">
          <div>
            <span className="edc-teacher-breadcrumb">
              Teacher Workspace / {teacherEarningsDetailConfig ? `Earnings / ${teacherEarningsDetailConfig.title}` : teacherStudentDetailConfig ? `My Students / ${teacherStudentDetailConfig.title}` : teacherStatDetailConfig ? `Overview / ${teacherStatDetailConfig.title}` : navigation.find(([id]) => id === tab)?.[1]}
            </span>

            <h2>
              {teacherEarningsDetailConfig?.title || teacherStudentDetailConfig?.title || teacherStatDetailConfig?.title || navigation.find(([id]) => id === tab)?.[1]}
            </h2>
          </div>
          <button type="button" className="edc-dashboard-logout" onClick={signOut}>
            <LogOut size={17} /> Log out
          </button>
        </header>

        {teacherStatDetailConfig && (
          <section className="edc-teacher-stat-detail-page">
            <button type="button" className="edc-teacher-detail-back" onClick={() => navigateTo("overview")}>
              <ArrowRight size={16} /> Back to Overview
            </button>
            <p className="edc-teacher-detail-description">{teacherStatDetailConfig.description}</p>
            {teacherStatDetailConfig.courses.length ? (
              <div className="edc-teacher-detail-courses">
                {teacherStatDetailConfig.courses.map((course) => (
                  <article key={course.id} className="edc-teacher-course-row">
                    <BookOpen size={22} color={purple} />
                    <div className="edc-teacher-course-info">
                      <strong>{course.title}</strong>
                      <span>{course.category || "Uncategorized"} · {(course.lessons || []).length} lessons</span>
                    </div>
                    <span className={`edc-teacher-stat-detail-status ${course.status === "Approved" ? "approved" : course.status === "Pending Approval" ? "pending" : "draft"}`}>
                      {course.status || "Draft"}
                    </span>
                    <button type="button" className="edc-teacher-detail-edit" onClick={() => startEdit(course)} aria-label={`Edit ${course.title}`}>
                      <Edit3 size={15} /> Edit
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <section className="edc-teacher-panel edc-teacher-detail-empty">
                <BookOpen size={38} color={purple} />
                <h3>{teacherStatDetailConfig.emptyMessage}</h3>
                <button type="button" className="edc-teacher-primary" onClick={startCreate}>
                  <Plus size={16} /> Create Course
                </button>
              </section>
            )}
          </section>
        )}

        {teacherStudentDetailConfig && (
          <section className="edc-teacher-stat-detail-page">
            <button type="button" className="edc-teacher-detail-back" onClick={() => navigateTo("students")}>
              <ArrowRight size={16} /> Back to My Students
            </button>
            <p className="edc-teacher-detail-description">{teacherStudentDetailConfig.description}</p>
            {teacherStudentDetailConfig.items.length ? (
              <div className="edc-teacher-detail-courses edc-teacher-student-detail-list">
                {teacherStudentDetailConfig.items.map((item) => (
                  <article key={item.id} className="edc-teacher-student-detail-row">
                    <div className="edc-teacher-course-info">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <span className="edc-teacher-stat-detail-status">{item.status}</span>
                    <div className="edc-teacher-student-detail-progress" role="img" aria-label={`${item.progress}% progress`}>
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="edc-teacher-panel edc-teacher-detail-empty">
                <Users size={38} color={purple} />
                <h3>{teacherStudentDetailConfig.emptyMessage}</h3>
              </section>
            )}
          </section>
        )}

        {teacherEarningsDetailConfig && (
          <section className="edc-teacher-stat-detail-page">
            <button type="button" className="edc-teacher-detail-back" onClick={() => navigateTo("earnings")}>
              <ArrowRight size={16} /> Back to Earnings
            </button>
            <p className="edc-teacher-detail-description">{teacherEarningsDetailConfig.description}</p>
            {teacherEarningsDetailConfig.items.length ? (
              <div className="edc-teacher-detail-courses edc-teacher-earnings-detail-list">
                {teacherEarningsDetailConfig.items.map((item) => (
                  <article key={item.id} className="edc-earnings-request-row">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <strong>PKR {item.amount.toLocaleString()}</strong>
                    <span className={`edc-earnings-status ${item.status === "Completed" ? "completed" : item.status === "Pending" ? "pending" : ""}`}>
                      {item.status}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <section className="edc-teacher-panel edc-teacher-detail-empty">
                <Wallet size={38} color={purple} />
                <h3>{teacherEarningsDetailConfig.emptyMessage}</h3>
              </section>
            )}
          </section>
        )}

        {/* STEP 1: OVERVIEW */}

        {tab === "overview" && !teacherStatDetailConfig && (
          <div className="edc-teacher-overview">
            <section className="edc-teacher-hero">
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  INSTRUCTOR OVERVIEW
                </span>

                <h3>
                  Welcome back, {profile.name || "Instructor"}!
                </h3>

                <p>
                  Manage your courses, organize lessons,
                  and track your teaching progress
                  from one place.
                </p>

                <button
                  type="button"
                  className="edc-teacher-white-btn"
                  onClick={startCreate}
                >
                  <Plus size={16} />
                  Create New Course
                </button>
              </div>

              <GraduationCap
                size={90}
                style={{ flexShrink: 0, opacity: 0.35 }}
              />
            </section>

            {/* STATISTICS */}

            <section className="edc-teacher-stats">
              {statCards.map(({ label, value, icon: Icon }) => (
                <button
                  type="button"
                  key={label}
                  className="edc-teacher-stat edc-teacher-stat-button"
                  onClick={() => navigate(`/teacher/dashboard/overview/${{
                    "Total Courses": "total-courses",
                    "Draft Courses": "draft-courses",
                    "Pending Approval": "pending-approval",
                    "Approved Courses": "approved-courses",
                  }[label]}`)}
                >
                  <div className="edc-teacher-stat-icon">
                    <Icon size={23} />
                  </div>

                  <strong>{value}</strong>

                  <span style={{ color: "#80758e" }}>
                    {label}
                  </span>
                </button>
              ))}
            </section>

            <div className="edc-teacher-overview-grid">
              {/* RECENT COURSES */}

              <section className="edc-teacher-panel">
                <div className="edc-teacher-panel-heading">
                  <h3>Recent Courses</h3>

                  <button
                    type="button"
                    style={styles.lightButton}
                    onClick={() => navigateTo("courses")}
                  >
                    View All
                    <ArrowRight size={15} />
                  </button>
                </div>

                {recentCourses.length === 0 ? (
                  <div
                    style={{
                      padding: "25px 10px",
                      textAlign: "center",
                    }}
                  >
                    <BookOpen
                      size={38}
                      color={purple}
                      style={{ margin: "0 auto" }}
                    />

                    <h4>No courses yet</h4>

                    <p style={{ color: "#80758e" }}>
                      Create your first course to get started.
                    </p>

                    <button
                      type="button"
                      style={styles.button}
                      onClick={startCreate}
                    >
                      <Plus size={16} />
                      Create Course
                    </button>
                  </div>
                ) : (
                  recentCourses.map((course) => (
                    <div
                      key={course.id}
                      className="edc-teacher-course-row"
                    >
                      <BookOpen size={22} color={purple} />

                      <div className="edc-teacher-course-info">
                        <strong>{course.title}</strong>

                        <span>
                          {course.category} ·{" "}
                          {(course.lessons || []).length} lessons
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          color:
                            course.status === "Approved"
                              ? "#15803d"
                              : course.status === "Pending Approval"
                              ? "#b45309"
                              : "#6d28d9",
                        }}
                      >
                        {course.status || "Draft"}
                      </span>

                      <button
                        type="button"
                        style={styles.lightButton}
                        onClick={() => startEdit(course)}
                        aria-label={`Edit ${course.title}`}
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </section>

              {/* TEACHING SUMMARY */}

              <div className="edc-teacher-overview-side">
                <section className="edc-teacher-panel">
                  <div className="edc-teacher-panel-heading">
                    <h3>Teaching Summary</h3>
                  </div>

                  <div className="edc-teacher-summary-row">
                    <span>Total Lessons</span>
                    <strong>{totalLessons}</strong>
                  </div>

                  <div className="edc-teacher-summary-row">
                    <span>Draft Courses</span>
                    <strong>{draftCount}</strong>
                  </div>

                  <div className="edc-teacher-summary-row">
                    <span>Pending Approval</span>
                    <strong>{pendingCount}</strong>
                  </div>

                  <div className="edc-teacher-summary-row">
                    <span>Approved Courses</span>
                    <strong>{approvedCount}</strong>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: "#90849d",
                      lineHeight: 1.6,
                    }}
                  >
                    Student enrollments and verified earnings
                    will be connected through the backend.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* MY COURSES */}

       
{tab === "analytics" && <InstructorAnalytics email={email} courses={courses} />}
{tab === "quizzes" && <CourseQuizzes role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))} />}
{tab === "course-assignments" && <CourseAssignments role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))} />}
{tab === "curriculum" && <CurriculumBuilder role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))}
  onAddLesson={(courseId, lesson) => setCourses(prev => prev.map(c => String(c.id)===String(courseId) ? {...c,lessons:[...(Array.isArray(c.lessons)?c.lessons:[]),lesson]} : c))}
  onReorderLessons={(courseId, orderedIds) => setCourses(prev => prev.map(c => {
    if(String(c.id)!==String(courseId))return c;
    const old=Array.isArray(c.lessons)?c.lessons:[];
    const picked=orderedIds.map(id=>old.find(l=>String(l.id)===String(id))).filter(Boolean);
    const remaining=old.filter(l=>!orderedIds.some(id=>String(id)===String(l.id)));
    return {...c,lessons:[...picked,...remaining]};
  }))}
/>}
{tab === "reviews" && <CourseReviews role="teacher" email={email} courses={courses} />}
{tab === "discussions" && <CourseDiscussions role="teacher" email={email} courses={courses.map(course => ({ ...course, teacherEmail: email }))} />}

{tab === "courses" && (
  <div style={{ display: "grid", gap: 20 }}>
    {/* SEARCH AND FILTERS */}

    <section className="edc-teacher-course-filters">
      <input
        type="search"
        placeholder="Search courses..."
        value={courseSearch}
        onChange={(e) => setCourseSearch(e.target.value)}
      />

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="All">All Categories</option>
        <option value="Development">Development</option>
        <option value="Design">Design</option>
        <option value="Business">Business</option>
        <option value="Data Science">Data Science</option>
        <option value="IT & Software">IT & Software</option>
        <option value="Personal Growth">Personal Growth</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="All">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Pending Approval">
          Pending Approval
        </option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>
    </section>

    {/* HEADER */}

    <section style={styles.panel}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3>My Courses</h3>
          <p>Create, edit and manage your courses.</p>
        </div>

        <button
          type="button"
          style={styles.button}
          onClick={startCreate}
        >
          <Plus size={17} />
          Add Course
        </button>
      </div>
    </section>

    {/* CREATE / EDIT FORM */}

  
{showForm && (
  <form
    onSubmit={saveCourse}
    className="edc-course-editor"
  >
    <div className="edc-course-editor-header">
      <div>
        <span className="edc-course-editor-eyebrow">
          COURSE MANAGEMENT
        </span>
        <h2>
          {editingId ? "Edit Course" : "Create New Course"}
        </h2>
        <p>
          Add your course information and a thumbnail
          to make your course stand out.
        </p>
      </div>

      <button
        type="button"
        className="edc-course-editor-close"
        onClick={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        aria-label="Close form"
      >
        <X size={20} />
      </button>
    </div>

    <div className="edc-course-editor-layout">
      <div className="edc-course-editor-fields">
        <h3>Course Information</h3>

        <div className="edc-course-editor-field">
          <label htmlFor="edc-course-title">
            Course Title
          </label>
          <input
            id="edc-course-title"
            required
            value={courseForm.title}
            onChange={(e) =>
              setCourseForm({
                ...courseForm,
                title: e.target.value,
              })
            }
            placeholder="e.g. Complete React Developer Course"
          />
        </div>

        <div className="edc-course-editor-two-cols">
          <div className="edc-course-editor-field">
            <label htmlFor="edc-course-category">
              Category
            </label>
            <select
              id="edc-course-category"
              value={courseForm.category}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  category: e.target.value,
                })
              }
            >
              <option>Development</option>
              <option>Design</option>
              <option>Business</option>
              <option>Data Science</option>
              <option>IT & Software</option>
              <option>Personal Growth</option>
            </select>
          </div>

          <div className="edc-course-editor-field">
            <label htmlFor="edc-course-level">
              Course Level
            </label>
            <select
              id="edc-course-level"
              value={courseForm.level}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  level: e.target.value,
                })
              }
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        <div className="edc-course-editor-field">
          <label htmlFor="edc-course-description">
            Course Description
          </label>
          <textarea
            id="edc-course-description"
            required
            rows={5}
            value={courseForm.description}
            onChange={(e) =>
              setCourseForm({
                ...courseForm,
                description: e.target.value,
              })
            }
            placeholder="Explain what students will learn..."
          />
        </div>

        <div className="edc-course-editor-field">
          <label htmlFor="edc-course-price">
            Course Price (PKR)
          </label>
          <input
            id="edc-course-price"
            type="number"
            min="0"
            required
            value={courseForm.price}
            onChange={(e) =>
              setCourseForm({
                ...courseForm,
                price: e.target.value,
              })
            }
            placeholder="e.g. 2500"
          />
        </div>
      </div>

      <div className="edc-course-editor-media">
        <h3>Course Thumbnail</h3>
        <p>
          Upload a cover image for your course.
        </p>

        <div className="edc-course-editor-image-box">
          {courseForm.thumbnail ? (
            <img
              src={courseForm.thumbnail}
              alt="Course thumbnail preview"
            />
          ) : (
            <div className="edc-course-editor-image-empty">
              <BookOpen size={42} />
              <strong>Course Cover</strong>
              <span>Recommended ratio 16:9</span>
            </div>
          )}
        </div>

        <label className="edc-course-editor-upload">
          <Plus size={17} />
          {courseForm.thumbnail
            ? "Change Image"
            : "Upload Image"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailUpload}
            hidden
          />
        </label>

        {courseForm.thumbnail && (
          <button
            type="button"
            className="edc-course-editor-remove"
            onClick={removeThumbnail}
          >
            <Trash2 size={16} />
            Remove Image
          </button>
        )}

        <p className="edc-course-editor-image-help">
          JPG, PNG or WebP · Maximum 1 MB
        </p>

        <div className="edc-course-editor-tip">
          <strong>Course Tip</strong>
          <p>
            Use a clear title, useful description,
            and attractive thumbnail to help
            students understand your course.
          </p>
        </div>
      </div>
    </div>

    <div className="edc-course-editor-footer">
      <button
        type="button"
        className="edc-course-editor-cancel"
        onClick={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="edc-course-editor-save"
      >
        <CheckCircle2 size={18} />
        {editingId ? "Update Course" : "Save Course"}
      </button>
    </div>
  </form>
)}

    {/* PROFESSIONAL COURSE CARDS */}

    {filteredCourses.length === 0 ? (
      <section className="edc-teacher-empty-courses">
        <BookOpen size={40} color="#7042d8" />

        <h3>No Courses Found</h3>

        <p>
          {courses.length === 0
            ? "Create your first course to get started."
            : "No courses match your search or filters."}
        </p>

        {courses.length === 0 && (
          <button
            type="button"
            className="edc-teacher-primary"
            onClick={startCreate}
          >
            <Plus size={17} />
            Create Course
          </button>
        )}
      </section>
    ) : (
      <div className="edc-teacher-course-grid">
        {filteredCourses.map((course) => (
          <article
            key={course.id}
            className="edc-teacher-course-card"
          >
            <div className="edc-teacher-course-thumbnail">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                />
              ) : (
                <div className="edc-teacher-course-placeholder">
                  <BookOpen size={48} />
                  <span>EduConnect AI</span>
                </div>
              )}

              <span
                className={`edc-teacher-status-badge ${
                  course.status === "Approved"
                    ? "approved"
                    : course.status === "Pending Approval"
                    ? "pending"
                    : course.status === "Rejected"
                    ? "rejected"
                    : "draft"
                }`}
              >
                {course.status || "Draft"}
              </span>
            </div>

            <div className="edc-teacher-course-card-body">
              <span className="edc-teacher-course-category">
                {course.category}
              </span>

              <h3>{course.title}</h3>

              <p className="edc-teacher-course-description">
                {course.description || "No description added."}
              </p>

              <div className="edc-teacher-course-meta">
                <span>
                  <GraduationCap size={15} />
                  {course.level}
                </span>

                <span>
                  <BookOpen size={15} />
                  {(course.lessons || []).length} Lessons
                </span>
              </div>

              <div className="edc-teacher-course-price">
                PKR{" "}
                {Number(course.price || 0).toLocaleString()}
              </div>

              <div className="edc-teacher-course-actions">
                <button
                  type="button"
                  onClick={() => startEdit(course)}
                >
                  <Edit3 size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("lessons")}
                >
                  <BookOpen size={15} />
                  Lessons
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewCourse(course)}
                >
                  <ArrowRight size={15} />
                  Preview
                </button>

                <button
                  type="button"
                  disabled={
                    course.status === "Pending Approval" ||
                    course.status === "Approved"
                  }
                  onClick={() =>
                    submitForApproval(course.id)
                  }
                >
                  <Send size={15} />
                  Submit
                </button>

                <button
                  type="button"
                  className="delete"
                  onClick={() => deleteCourse(course.id)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </div>
)}


        {/* LESSONS */}

{tab === "lessons" && (
  <div className="edc-lessons-page">
    <div className="edc-lessons-page-header">
      <div>
        <span className="edc-lessons-eyebrow">
          COURSE CONTENT
        </span>
        <h2>Lessons Management</h2>
        <p>
          Create, organize and manage your course lessons.
        </p>
      </div>

      <div className="edc-lessons-header-actions">
        <button
          type="button"
          className="edc-lessons-add-button"
          disabled={!courses.length}
          onClick={() => openLessonForm(courses[0]?.id || "")}
        >
          <Plus size={17} /> Add Lesson
        </button>

        <div className="edc-lessons-count">
        <BookOpen size={20} />
        <span>
          {courses.reduce(
            (total, course) =>
              total + (course.lessons || []).length,
            0
          )}{" "}
          Total Lessons
        </span>
        </div>
      </div>
    </div>

    {courses.length === 0 ? (
      <div className="edc-lessons-empty">
        <BookOpen size={42} />
        <h3>No Courses Yet</h3>
        <p>
          Create your first course before adding lessons.
        </p>

        <button
          type="button"
          onClick={() => {
            startCreate();
            navigateTo("courses");
          }}
        >
          <Plus size={17} />
          Create Course
        </button>
      </div>
    ) : (
      <div className="edc-lessons-course-list">
        {courses.map((course) => (
          <section
            key={course.id}
            className="edc-lessons-course-card"
          >
            <div className="edc-lessons-course-header">
              <div className="edc-lessons-course-info">
                <div className="edc-lessons-course-icon">
                  <BookOpen size={23} />
                </div>

                <div>
                  <h3>{course.title}</h3>
                  <p>
                    {course.category} ·{" "}
                    {(course.lessons || []).length} lessons
                  </p>
                </div>
              </div>

            </div>

            {(course.lessons || []).length === 0 ? (
              <div className="edc-lessons-no-content">
                <Layers3 size={30} />
                <p>No lessons added yet.</p>
                <span>
                  Use the Add Lesson button above to create your first lesson.
                </span>
              </div>
            ) : (
              <div className="edc-lessons-items">
                {(course.lessons || []).map(
                  (lesson, index) => (
                    <div
                      key={lesson.id}
                      className="edc-lessons-item"
                    >
                      <div className="edc-lessons-item-number">
                        {index + 1}
                      </div>

                      <div className="edc-lessons-item-info">
                        <h4>{lesson.title}</h4>

                        {lesson.description && (
                          <p>{lesson.description}</p>
                        )}

                        <div className="edc-lessons-item-meta">
                          {lesson.duration && (
                            <span>
                              <Clock3 size={14} />
                              {lesson.duration} min
                            </span>
                          )}

                          {lesson.isFreePreview && (
                            <span className="edc-lessons-free-badge">
                              Free Preview
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="edc-lessons-item-actions">
                        <button
                          type="button"
                          title="Move up"
                          disabled={index === 0}
                          onClick={() =>
                            moveLesson(
                              course.id,
                              lesson.id,
                              -1
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          title="Move down"
                          disabled={
                            index ===
                            (course.lessons || []).length - 1
                          }
                          onClick={() =>
                            moveLesson(
                              course.id,
                              lesson.id,
                              1
                            )
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          title="Edit lesson"
                          onClick={() =>
                            openLessonForm(
                              course.id,
                              lesson
                            )
                          }
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete lesson"
                          className="delete"
                          onClick={() =>
                            removeLesson(
                              course.id,
                              lesson.id
                            )
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    )}

    {showLessonForm && (
      <div
        className="edc-lesson-modal-overlay"
        onClick={closeLessonForm}
      >
        <form
          className="edc-lesson-modal"
          onSubmit={saveLesson}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="edc-lesson-modal-header">
            <div>
              <h3>
                {editingLessonId !== null
                  ? "Edit Lesson"
                  : "Add New Lesson"}
              </h3>
              <p>
                Enter your lesson information below.
              </p>
            </div>

            <button
              type="button"
              onClick={closeLessonForm}
              aria-label="Close lesson form"
            >
              <X size={20} />
            </button>
          </div>

          <div className="edc-lesson-modal-body">
            <div className="edc-lesson-field">
              <label htmlFor="edc-lesson-course">Course</label>
              <select
                id="edc-lesson-course"
                required
                value={selectedLessonCourse}
                disabled={editingLessonId !== null}
                onChange={(event) => setSelectedLessonCourse(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div className="edc-lesson-field">
              <label>Lesson Title</label>
              <input
                required
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Introduction to React"
              />
            </div>

            <div className="edc-lesson-field">
              <label>Lesson Description</label>
              <textarea
                rows={4}
                value={lessonForm.description}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    description: e.target.value,
                  })
                }
                placeholder="What will students learn?"
              />
            </div>

            <div className="edc-lesson-field">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min="0"
                value={lessonForm.duration}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    duration: e.target.value,
                  })
                }
                placeholder="e.g. 15"
              />
            </div>

            <div className="edc-lesson-field">
              <label>Lesson Video</label>

              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) =>
                  setLessonVideoFile(
                    e.target.files?.[0] || null
                  )
                }
              />

              <small>
                {lessonVideoFile
                  ? `Selected: ${lessonVideoFile.name}`
                  : "MP4/WebM saved locally in this browser (IndexedDB)."}
              </small>
            </div>

            <label className="edc-lesson-preview-toggle">
              <input
                type="checkbox"
                checked={lessonForm.isFreePreview}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    isFreePreview: e.target.checked,
                  })
                }
              />

              <span>
                <strong>Free Preview Lesson</strong>
                <small>
                  Allow students to preview this lesson.
                </small>
              </span>
            </label>
          </div>

          <div className="edc-lesson-modal-footer">
            <button
              type="button"
              className="cancel"
              onClick={closeLessonForm}
            >
              Cancel
            </button>

            <button type="submit" className="save">
              <CheckCircle2 size={17} />
              {editingLessonId !== null
                ? "Update Lesson"
                : "Save Lesson"}
            </button>
          </div>
        </form>
      </div>
    )}
  </div>
)}


        {/* STUDENTS */}

      
{/* STUDENTS */}

{tab === "students" && !teacherStudentDetailConfig && (
  <div className="edc-students-page">
    <div className="edc-students-header">
      <div>
        <span className="edc-students-eyebrow">
          STUDENT MANAGEMENT
        </span>
        <h2>My Students</h2>
        <p>
          View student enrollments and learning progress.
        </p>
      </div>

      <span className="edc-students-demo-badge">
        Demo Data
      </span>
    </div>

    <div className="edc-students-stats">
      <button type="button" className="edc-students-stat-card edc-students-stat-button"
        onClick={() => navigate("/teacher/dashboard/students/total-students")}>
        <Users size={23} />
        <div>
          <h3>{demoStudents.length}</h3>
          <p>Total Demo Students</p>
        </div>
      </button>

      <button type="button" className="edc-students-stat-card edc-students-stat-button"
        onClick={() => navigate("/teacher/dashboard/students/demo-courses")}>
        <BookOpen size={23} />
        <div>
          <h3>{studentCourses.length}</h3>
          <p>Demo Courses</p>
        </div>
      </button>

      <button type="button" className="edc-students-stat-card edc-students-stat-button"
        onClick={() => navigate("/teacher/dashboard/students/average-progress")}>
        <CheckCircle2 size={23} />
        <div>
          <h3>
            {Math.round(
              demoStudents.reduce(
                (total, student) => total + student.progress,
                0
              ) / demoStudents.length
            )}
            %
          </h3>
          <p>Average Demo Progress</p>
        </div>
      </button>
    </div>

    <div className="edc-students-main-card">
      <div className="edc-students-toolbar">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
        />

        <select
          value={studentCourseFilter}
          onChange={(e) =>
            setStudentCourseFilter(e.target.value)
          }
        >
          <option value="All">All Courses</option>

          {studentCourses.map((courseTitle) => (
            <option key={courseTitle} value={courseTitle}>
              {courseTitle}
            </option>
          ))}
        </select>
      </div>

      <div className="edc-students-table-wrap">
        <table className="edc-students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrolled Course</th>
              <th>Enrollment Date</th>
              <th>Progress</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="edc-students-person">
                    <div className="edc-students-avatar">
                      {student.name.charAt(0)}
                    </div>

                    <div>
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </div>
                  </div>
                </td>

                <td>{student.courseTitle}</td>

                <td>{student.enrolledAt}</td>

                <td>
                  <div className="edc-students-progress">
                    <div className="edc-students-progress-track">
                      <div
                        className="edc-students-progress-fill"
                        style={{
                          width: `${student.progress}%`,
                        }}
                      />
                    </div>
                    <span>{student.progress}%</span>
                  </div>
                </td>

                <td>
                  <button
                    type="button"
                    className="edc-students-view-button"
                    onClick={() => setSelectedStudent(student)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="edc-students-empty">
            No students match your search.
          </div>
        )}
      </div>
    </div>

    {selectedStudent && (
      <div
        className="edc-students-modal-overlay"
        onClick={() => setSelectedStudent(null)}
      >
        <div
          className="edc-students-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Student details"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="edc-students-modal-header">
            <h3>Student Details</h3>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              aria-label="Close student details"
            >
              <X size={20} />
            </button>
          </div>

          <div className="edc-students-modal-body">
            <div className="edc-students-modal-person">
              <div className="edc-students-avatar large">
                {selectedStudent.name.charAt(0)}
              </div>

              <div>
                <h3>{selectedStudent.name}</h3>
                <p>{selectedStudent.email}</p>
              </div>
            </div>

            <div className="edc-students-detail-row">
              <span>Course</span>
              <strong>{selectedStudent.courseTitle}</strong>
            </div>

            <div className="edc-students-detail-row">
              <span>Enrollment Date</span>
              <strong>{selectedStudent.enrolledAt}</strong>
            </div>

            <div className="edc-students-detail-row">
              <span>Completed Lessons</span>
              <strong>
                {selectedStudent.completedLessons} /{" "}
                {selectedStudent.totalLessons}
              </strong>
            </div>

            <div className="edc-students-detail-row">
              <span>Course Progress</span>
              <strong>{selectedStudent.progress}%</strong>
            </div>

            <div className="edc-students-progress-track">
              <div
                className="edc-students-progress-fill"
                style={{
                  width: `${selectedStudent.progress}%`,
                }}
              />
            </div>

            <p className="edc-students-demo-note">
              This is demonstration data, not a verified
              student enrollment.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}


        {/* EARNINGS */}

      
{/* EARNINGS */}

{tab === "earnings" && !teacherEarningsDetailConfig && (
  <div className="edc-earnings-page">
    <div className="edc-earnings-header">
      <div>
        <span className="edc-earnings-eyebrow">
          FINANCIAL OVERVIEW
        </span>
        <h2>Teacher Earnings</h2>
        <p>
          Track your course revenue, sales and transactions.
        </p>
      </div>

      <span className="edc-earnings-demo-badge">
        Demo Financial Data
      </span>
    </div>

    <div className="edc-earnings-stats">
      <button type="button" className="edc-earnings-stat-card edc-earnings-stat-button"
        onClick={() => navigate("/teacher/dashboard/earnings/total-earnings")}>
        <div className="edc-earnings-stat-icon">
          <Wallet size={24} />
        </div>
        <p>Total Demo Earnings</p>
        <h3>PKR {totalDemoEarnings.toLocaleString()}</h3>
        <span>Sample revenue across 6 months</span>
      </button>

      <button type="button" className="edc-earnings-stat-card edc-earnings-stat-button"
        onClick={() => navigate("/teacher/dashboard/earnings/monthly-earnings")}>
        <div className="edc-earnings-stat-icon">
          <Clock3 size={24} />
        </div>
        <p>November Demo Earnings</p>
        <h3>PKR {demoMonthlyEarnings.toLocaleString()}</h3>
        <span>Sample monthly revenue</span>
      </button>

      <button type="button" className="edc-earnings-stat-card edc-earnings-stat-button"
        onClick={() => navigate("/teacher/dashboard/earnings/completed-sales")}>
        <div className="edc-earnings-stat-icon">
          <BookOpen size={24} />
        </div>
        <p>Demo Completed Sales</p>
        <h3>{demoCompletedSales}</h3>
        <span>Completed sample transactions</span>
      </button>
    </div>

    <div className="edc-earnings-chart-card">
      <div className="edc-earnings-section-header">
        <div>
          <h3>Revenue Overview</h3>
          <p>Sample monthly earnings in PKR</p>
        </div>

        <select
          value={earningsPeriod}
          onChange={(e) => setEarningsPeriod(e.target.value)}
        >
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
        </select>
      </div>

      <div className="edc-earnings-chart">
        {demoChartData.map((item) => (
          <div
            key={item.month}
            className="edc-earnings-chart-column"
          >
            <strong>
              {(item.revenue / 1000).toFixed(1)}k
            </strong>

            <div className="edc-earnings-chart-bar-track">
              <div
                className="edc-earnings-chart-bar"
                style={{
                  height: `${
                    (item.revenue /
                      Math.max(
                        ...demoChartData.map(
                          (entry) => entry.revenue
                        )
                      )) * 100
                  }%`,
                }}
              />
            </div>

            <span>{item.month}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="edc-earnings-withdrawal-card">
      <div>
        <h3>Withdrawal Requests</h3>
        <p>
          Test the withdrawal request interface using
          demo earnings. No real money will be transferred.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowWithdrawalForm(true)}
      >
        <Wallet size={17} />
        Demo Withdrawal
      </button>
    </div>

    {demoWithdrawalRequests.length > 0 && (
      <div className="edc-earnings-transactions-card">
        <h3>Demo Withdrawal Requests</h3>

        {demoWithdrawalRequests.map((request) => (
          <div
            key={request.id}
            className="edc-earnings-request-row"
          >
            <div>
              <strong>{request.id}</strong>
              <p>{request.date}</p>
            </div>

            <strong>
              PKR {request.amount.toLocaleString()}
            </strong>

            <span className="edc-earnings-status pending">
              {request.status}
            </span>
          </div>
        ))}
      </div>
    )}

    <div className="edc-earnings-transactions-card">
      <div className="edc-earnings-section-header">
        <div>
          <h3>Transaction History</h3>
          <p>Sample course purchase transactions</p>
        </div>

        <input
          type="search"
          placeholder="Search transactions..."
          value={transactionSearch}
          onChange={(e) =>
            setTransactionSearch(e.target.value)
          }
        />
      </div>

      <div className="edc-earnings-table-wrap">
        <table className="edc-earnings-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Student</th>
              <th>Course</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.student}</td>
                <td>{transaction.course}</td>
                <td>{transaction.date}</td>
                <td>
                  PKR {transaction.amount.toLocaleString()}
                </td>
                <td>
                  <span
                    className={`edc-earnings-status ${
                      transaction.status === "Completed"
                        ? "completed"
                        : "pending"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="edc-earnings-empty">
            No matching transactions found.
          </div>
        )}
      </div>
    </div>

    {showWithdrawalForm && (
      <div
        className="edc-earnings-modal-overlay"
        onClick={() => setShowWithdrawalForm(false)}
      >
        <form
          className="edc-earnings-modal"
          onSubmit={handleDemoWithdrawal}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="edc-earnings-modal-header">
            <h3>Demo Withdrawal Request</h3>

            <button
              type="button"
              onClick={() => setShowWithdrawalForm(false)}
              aria-label="Close withdrawal form"
            >
              <X size={20} />
            </button>
          </div>

          <div className="edc-earnings-modal-body">
            <p>
              This is a frontend demonstration only.
              No actual payout will be processed.
            </p>

            <label htmlFor="edc-withdrawal-amount">
              Demo Amount (PKR)
            </label>

            <input
              id="edc-withdrawal-amount"
              type="number"
              min="1"
              max={totalDemoEarnings}
              required
              value={withdrawalAmount}
              onChange={(e) =>
                setWithdrawalAmount(e.target.value)
              }
              placeholder="Enter amount"
            />

            <button type="submit">
              Submit Demo Request
            </button>
          </div>
        </form>
      </div>
    )}
  </div>
)}


        {/* PROFILE */}
        {tab === "profile" && (
          <div className="edc-profile-page">
            <div className="edc-profile-heading">
              <div>
                <span className="edc-profile-eyebrow">INSTRUCTOR SETTINGS</span>
                <h2>Teacher Profile</h2>
                <p>Manage your professional instructor information.</p>
              </div>
              <span className="edc-profile-local-badge">Browser Storage</span>
            </div>
            <div className="edc-profile-layout">
              <section className="edc-profile-editor">
                <div className="edc-profile-card-heading">
                  <h3>Personal Information</h3>
                  <p>Update your profile details below.</p>
                </div>
                <form
                  className="edc-profile-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    try {
                      localStorage.setItem(profileKey, JSON.stringify(profile));
                      setProfileSaved(true);
                    } catch {
                      setProfileSaved(false);
                      alert("Profile could not be saved. Check browser storage.");
                    }
                  }}
                >
                  <div className="edc-profile-upload-section">
                    <div className="edc-profile-avatar">
                      {teacherProfileImage ? (
                        <img src={teacherProfileImage} alt="Instructor profile" />
                      ) : (
                        <span>{teacherDisplayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="edc-profile-upload-actions">
                      <label className="edc-profile-upload-button" htmlFor="edc-profile-picture">
                        Upload Picture
                      </label>
                      <input
                        id="edc-profile-picture"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleTeacherProfileImage}
                        hidden
                      />
                      {teacherProfileImage && (
                        <button
                          type="button"
                          className="edc-profile-remove-button"
                          onClick={() => {
                            setProfile((previous) => ({ ...previous, avatar: "" }));
                            setProfileSaved(false);
                          }}
                        >
                          Remove Picture
                        </button>
                      )}
                      <small>JPG, PNG or WebP, maximum 1 MB</small>
                    </div>
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-name">Full Name</label>
                    <input
                      id="edc-profile-name"
                      required
                      value={profile.name || ""}
                      onChange={(event) => {
                        setProfileSaved(false);
                        setProfile((previous) => ({ ...previous, name: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-email">Email</label>
                    <input id="edc-profile-email" value={email} disabled />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-headline">Professional Headline</label>
                    <input
                      id="edc-profile-headline"
                      value={profile.headline || ""}
                      placeholder="React & Web Development Instructor"
                      onChange={(event) => {
                        setProfileSaved(false);
                        setProfile((previous) => ({ ...previous, headline: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-expertise">Expertise</label>
                    <input
                      id="edc-profile-expertise"
                      value={teacherExpertise}
                      placeholder="React, JavaScript, UI/UX"
                      onChange={(event) => {
                        setProfileSaved(false);
                        setProfile((previous) => ({ ...previous, expertise: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-bio">About Me</label>
                    <textarea
                      id="edc-profile-bio"
                      rows={6}
                      value={profile.bio || ""}
                      placeholder="Tell students about your experience..."
                      onChange={(event) => {
                        setProfileSaved(false);
                        setProfile((previous) => ({ ...previous, bio: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="edc-profile-form-footer">
                    <button className="edc-profile-save-button" type="submit">
                      <CheckCircle2 size={18} /> Save Profile
                    </button>
                    {profileSaved && (
                      <span className="edc-profile-success">
                        <CheckCircle2 size={17} /> Profile saved successfully
                      </span>
                    )}
                  </div>
                </form>
              </section>
              <aside className="edc-profile-preview-card">
                <div className="edc-profile-preview-heading">
                  <h3>Live Profile Preview</h3>
                  <p>Preview of your instructor information.</p>
                </div>
                <div className="edc-profile-preview-banner" />
                <div className="edc-profile-preview-content">
                  <div className="edc-profile-preview-avatar">
                    {teacherProfileImage ? (
                      <img src={teacherProfileImage} alt="Instructor" />
                    ) : (
                      <span>{teacherDisplayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <h3>{teacherDisplayName}</h3>
                  <p className="edc-profile-preview-headline">
                    {profile.headline || "Professional Instructor"}
                  </p>
                  <span className="edc-profile-preview-role">
                    <GraduationCap size={15} /> EduConnect AI Instructor
                  </span>
                  <div className="edc-profile-preview-divider" />
                  <div className="edc-profile-preview-detail">
                    <strong>Expertise</strong>
                    <p>{teacherExpertise || "Add your expertise"}</p>
                  </div>
                  <div className="edc-profile-preview-detail">
                    <strong>About Instructor</strong>
                    <p>{profile.bio || "Your instructor biography will appear here."}</p>
                  </div>
                  <div className="edc-profile-preview-detail">
                    <strong>Contact Email</strong>
                    <p>{email}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        <p
          style={{
            marginTop: 25,
            fontSize: 12,
            color: "#9387a2",
          }}
        >
          Teacher Dashboard frontend demo. Course and
          profile data are stored locally in this browser.
          Real approvals, enrollments and payments require
          backend integration.
        </p>
        
{previewCourse && (
  <div
    className="edc-teacher-preview-overlay"
    onClick={() => setPreviewCourse(null)}
  >
    <div
      className="edc-teacher-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Course preview"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="edc-teacher-preview-header">
        <h3>Course Preview</h3>

        <button
          type="button"
          onClick={() => setPreviewCourse(null)}
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
      </div>

      <div className="edc-teacher-preview-content">
        {previewCourse.thumbnail ? (
          <img
            className="edc-teacher-preview-image"
            src={previewCourse.thumbnail}
            alt={previewCourse.title}
          />
        ) : (
          <div className="edc-teacher-preview-placeholder">
            <BookOpen size={50} />
            <span>EduConnect AI Course</span>
          </div>
        )}

        <h2>{previewCourse.title}</h2>

        <p>
          {previewCourse.category} · {previewCourse.level}
        </p>

        <p>{previewCourse.description}</p>

        <h3>
          PKR{" "}
          {Number(previewCourse.price || 0).toLocaleString()}
        </h3>

        <h4>Course Content</h4>

        {(previewCourse.lessons || []).length === 0 ? (
          <p>No lessons added yet.</p>
        ) : (
          (previewCourse.lessons || []).map(
            (lesson, index) => (
              <div
                key={lesson.id || index}
                className="edc-teacher-preview-lesson"
              >
                <BookOpen size={17} />
                <span>
                  Lesson {index + 1}: {lesson.title}
                </span>
              </div>
            )
          )
        )}

        <p className="edc-teacher-preview-note">
          This is a teacher preview. Student enrollment
          is not available from this popup.
        </p>
      </div>
    </div>
  </div>
)}

      </main>
    </section>
  );
}

export default TeacherDashboard;
