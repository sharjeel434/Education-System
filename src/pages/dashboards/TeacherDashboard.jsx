
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appendAdminActivityRecord } from "../../components/admin/adminData";
import { getStudentAcademicContext, getStudentAcademicSubjects, getProgramGroupsForDegreeLevel, INTERMEDIATE_STREAMS, isAcademicProfileComplete, ONLINE_COURSES } from "../../utils/studentRecommendations";
import {
  BookOpen,
  MessageCircle,
  CheckCircle2,
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
  Layers3,
  MoreVertical,
  Search,
  Star,
  ArrowLeft,
  ArrowRight,
  UserRound,
  LogOut,
  ShieldAlert,
  LifeBuoy,
  Bell,
  Crown,
  ChevronRight,
} from "lucide-react";

import { lessonVideoKey, saveLessonVideo, deleteLessonVideo } from "../../utils/lessonVideos";
import CourseReviews from "../../components/reviews/CourseReviews";
import CourseDiscussions from "../../components/discussions/CourseDiscussions";
import InstructorAnalytics from "../../components/analytics/InstructorAnalytics";
import CourseQuizzes from "../../components/quizzes/CourseQuizzes";
import CourseAssignments from "../../components/assignments/CourseAssignments";
import CurriculumBuilder from "../../components/curriculum/CurriculumBuilder";
import TeacherBooks from "../../components/books/TeacherBooks";
import UserModerationAppeals, { UserSupportCenter } from "../../components/moderation/UserModerationAppeals";
import NotificationsCenter from "../../components/notifications/NotificationsCenter";
import TeacherCourseEditor from "./TeacherCourseEditor";
import { NOTIFICATIONS_EVENT } from "../../utils/demoNotifications";
import "../../components/notifications/NotificationsCenter.css";

import TeacherOverview, { TeacherWorkspaceHeader } from "../../components/teacher/TeacherOverview";
import TeacherLessons from "../../components/teacher/TeacherLessons";
import TeacherStudents from "../../components/teacher/TeacherStudents";
import TeacherEarnings from "../../components/teacher/TeacherEarnings";
import { collectInstructorCourseAnalytics } from "../../utils/instructorAnalytics";
import { REVIEW_EVENT } from "../../utils/courseReviews";
import { ORDERS_EVENT } from "../../utils/studentCart";
import { ASSIGNMENT_EVENT } from "../../components/assignments/assignmentStorage";
import { DISCUSSIONS_EVENT } from "../../utils/courseDiscussions";

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

function compressCourseThumbnail(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDimension = 1280;
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

      try {
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Image compression is unavailable.");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let thumbnail = canvas.toDataURL("image/webp", 0.76);

        if (!thumbnail.startsWith("data:image/webp")) {
          throw new Error("WebP image compression is unavailable.");
        }

        if (thumbnail.length > 450 * 1024) {
          thumbnail = canvas.toDataURL("image/webp", 0.6);
        }

        if (thumbnail.length > 450 * 1024) {
          canvas.width = Math.max(1, Math.round(canvas.width * 0.75));
          canvas.height = Math.max(1, Math.round(canvas.height * 0.75));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          thumbnail = canvas.toDataURL("image/webp", 0.6);
        }

        if (thumbnail.length > 450 * 1024) {
          throw new Error("The selected image is too large to store.");
        }

        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = objectUrl;
  });
}

function formatCourseUpdatedAt(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";
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
  ["books", "My PDF/eBooks", BookOpen],
  ["profile", "My Profile", UserRound],
  ["help-support", "Help & Support", LifeBuoy],
  ["notifications", "Notifications", Bell],
  ["appeals", "Moderation & Appeals", ShieldAlert],
];

function TeacherDashboard({ email = "teacher@example.com" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const courseEditMatch = location.pathname.match(
    /^\/teacher\/dashboard\/courses\/([^/]+)\/edit\/?$/
  );
  let requestedCourseId = null;
  try {
    requestedCourseId = courseEditMatch
      ? decodeURIComponent(courseEditMatch[1])
      : null;
  } catch {
    requestedCourseId = null;
  }
  const courseKey = `educonnect.teacher.${email}.courses`;
  const profileKey = `educonnect.teacher.${email}.profile`;
  const teacherNotificationKey = `educonnect.teacher.${String(email || "").trim().toLowerCase()}.notifications`;

  function signOut() {
    window.sessionStorage.removeItem("educonnect.demoEmail");
    window.sessionStorage.removeItem("educonnect.demoRole");
    navigate("/login", { replace: true });
  }

  const [courses, setCourses] = useState(() =>
    readSaved(courseKey, [])
  );
  const coursesRef = useRef(courses);
  const [courseStorageError, setCourseStorageError] = useState("");

  function updateCourses(updater) {
    const updatedCourses =
      typeof updater === "function" ? updater(coursesRef.current) : updater;

    try {
      localStorage.setItem(courseKey, JSON.stringify(updatedCourses));
    } catch (error) {
      console.error("Could not save teacher courses", error);
      setCourseStorageError(
        error?.name === "QuotaExceededError"
          ? "Browser storage is full. Remove an older course image or free storage, then try saving again."
          : "Could not save your courses in browser storage. Please try again."
      );
      return false;
    }

    coursesRef.current = updatedCourses;
    setCourses(updatedCourses);
    setCourseStorageError("");
    window.dispatchEvent(new Event("educonnect:teacher-courses-changed"));
    return true;
  }

  const courseForEdit = requestedCourseId
    ? courses.find((item) => String(item.id) === requestedCourseId)
    : null;

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
        : location.pathname.startsWith("/teacher/dashboard/courses/")
          ? "courses"
        : "overview"
  );
  
const [notifications, setNotifications] = useState(() => readSaved(teacherNotificationKey, []));
const unreadNotifications = notifications.filter((item) => !item.read).length;

useEffect(() => {
  const refresh = () => setNotifications(readSaved(teacherNotificationKey, []));
  const refreshIfMatched = (event) => { if (!event.detail?.key || event.detail.key === teacherNotificationKey) refresh(); };
  const refreshStorage = (event) => { if (!event.key || event.key === teacherNotificationKey) refresh(); };
  window.addEventListener(NOTIFICATIONS_EVENT, refreshIfMatched);
  window.addEventListener("storage", refreshStorage);
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, refreshIfMatched);
    window.removeEventListener("storage", refreshStorage);
  };
}, [teacherNotificationKey]);

useEffect(() => {
  try { localStorage.setItem(teacherNotificationKey, JSON.stringify(notifications)); }
  catch (error) { console.error("Could not save teacher notifications", error); }
}, [notifications, teacherNotificationKey]);

function markNotificationRead(id) { setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)); }
function markAllNotificationsRead() { setNotifications((current) => current.map((item) => item.read ? item : { ...item, read: true })); }
function deleteNotification(id) { setNotifications((current) => current.filter((item) => item.id !== id)); }

const [workspaceRevision, setWorkspaceRevision] = useState(0);
useEffect(() => {
  const refresh = event => {
    if (event.type === "storage" && event.key === courseKey) {
      const saved = readSaved(courseKey, []);
      if (Array.isArray(saved)) {
        coursesRef.current = saved;
        setCourses(saved);
      }
    }
    if (event.type === "storage" && event.key === profileKey) {
      const saved = readSaved(profileKey, null);
      if (saved && typeof saved === "object") setProfile(saved);
    }
    setWorkspaceRevision(value => value + 1);
  };
  const events = ["storage", "focus", "educonnect:student-data-changed", "educonnect:student-header-changed", "educonnect:teacher-profile-changed", "educonnect:moderation-visibility-changed", REVIEW_EVENT, ORDERS_EVENT, ASSIGNMENT_EVENT, DISCUSSIONS_EVENT];
  events.forEach(event => window.addEventListener(event, refresh));
  return () => events.forEach(event => window.removeEventListener(event, refresh));
}, [courseKey, profileKey]);
const courseAnalytics = useMemo(() => collectInstructorCourseAnalytics(email, courses), [email, courses, workspaceRevision]);
const transactions = courseAnalytics.flatMap(course => course.salesRecords).map(record => ({ ...record, date: String(record.purchasedAt || "").slice(0, 10) }));
const now = new Date();
const currentMonthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
const currentMonthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const completedSales = transactions.length;

const [selectedStudent, setSelectedStudent] = useState(null);

const enrolledStudents = courseAnalytics.flatMap(course => course.enrollmentRecords);
const uniqueStudents = [...new Map(enrolledStudents.map(student => [student.email, student])).values()];
const courseAnalyticsById = new Map(courseAnalytics.map(course => [String(course.id), course]));
const courseRatings = courseAnalytics.flatMap(course => course.ratings);
const averageCourseRating = courseRatings.length
  ? courseRatings.reduce((sum, rating) => sum + rating, 0) / courseRatings.length
  : null;
const totalCourseLessons = courses.reduce(
  (total, course) => total + (Array.isArray(course.lessons) ? course.lessons.length : Math.max(0, Number(course.lessons) || 0)),
  0,
);

const studentCourses = [
  ...new Set(enrolledStudents.map((student) => student.courseTitle)),
];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(() => courseForEdit?.id ?? null);
  const [courseForm, setCourseForm] = useState(() =>
    courseForEdit
      ? {
          title: courseForEdit.title || "",
          category: courseForEdit.category || "Development",
          level: courseForEdit.level || "Beginner",
          description: courseForEdit.description || "",
          price: String(courseForEdit.price ?? ""),
          thumbnail: courseForEdit.thumbnail || "",
        }
      : { ...emptyCourse }
  );
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
const [openCourseMenu, setOpenCourseMenu] = useState("");

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

const courseStatusTabs = [
  { value: "All", label: "All Courses" },
  { value: "Published", label: "Published" },
  { value: "Draft", label: "Draft" },
  { value: "Pending Approval", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  ...[...new Set(courses.map(course => course.status || "Draft"))]
    .filter(status => !["Published", "Draft", "Pending Approval", "Approved"].includes(status))
    .map(status => ({ value: status, label: status })),
].map(tabItem => ({
  ...tabItem,
  count: tabItem.value === "All"
    ? courses.length
    : courses.filter(course => (course.status || "Draft") === tabItem.value).length,
}));

useEffect(() => {
  if (!openCourseMenu) return undefined;
  const closeMenu = event => {
    if (!event.target.closest(".edc-teacher-course-actions-menu")) {
      setOpenCourseMenu("");
    }
  };
  document.addEventListener("pointerdown", closeMenu);
  return () => document.removeEventListener("pointerdown", closeMenu);
}, [openCourseMenu]);

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
    setTab("courses");
    setMobileMenuOpen(false);
    navigate(`/teacher/dashboard/courses/${encodeURIComponent(course.id)}/edit`);
  }

  function closeCourseEditor() {
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

  compressCourseThumbnail(file).then((thumbnail) => {
    setCourseForm((previous) => ({
      ...previous,
      thumbnail,
    }));
  }).catch((error) => {
    console.error("Could not prepare course thumbnail", error);
    alert(
      error?.message === "The selected image is too large to store."
        ? "This image could not be compressed enough for browser storage. Please choose a smaller image."
        : "Unable to prepare the image. Please try another JPG, PNG or WebP file."
    );
  });
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

    let updatedCourses;

    if (editingId) {
      updatedCourses = courses.map((course) =>
          course.id === editingId
            ? {
                ...course,
                ...courseForm,
                title,
                description,
                price,
                updatedAt: new Date().toISOString(),
                status: course.status === "Published" ? "Published" : "Draft",
              }
            : course
      );
    } else {
      const id =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;

      updatedCourses = [
        ...courses,
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
      ];
    }

    if (!updateCourses(updatedCourses)) return;

    setShowForm(false);
    setEditingId(null);
    setCourseForm({ ...emptyCourse });
    navigateTo("courses");
  }

  function deleteCourse(id) {
    if (!window.confirm("Delete this course?")) return;
    const oldCourse = courses.find((item) => item.id === id);
    (oldCourse?.lessons || []).forEach((lesson) => {
      deleteLessonVideo(lessonVideoKey(email, id, lesson.id)).catch(console.error);
    });

    updateCourses((previous) =>
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

    updateCourses((previous) =>
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

    updateCourses((previous) =>
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

  updateCourses((previous) =>
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
  updateCourses((previous) =>
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
const teacherTeachingProfile = {
  educationLevel: profile.teachingEducationLevel || "",
  classNumber: profile.teachingClassNumber || "",
  intermediateYear: profile.teachingIntermediateYear || "",
  stream: profile.teachingStream || "",
  degreeLevel: profile.teachingDegreeLevel || "",
  programChoice: profile.teachingProgramChoice || "",
  program: profile.teachingProgram || "",
};
const teacherFocusComplete = isAcademicProfileComplete(teacherTeachingProfile);
const teacherFocusContext = getStudentAcademicContext(teacherTeachingProfile);
const teacherFocusSubjects = teacherFocusComplete ? getStudentAcademicSubjects(teacherTeachingProfile) : [];
const teacherFocusLabel = teacherFocusComplete
  ? `${teacherFocusContext.title}${teacherTeachingProfile.degreeLevel ? ` · ${teacherTeachingProfile.degreeLevel.toUpperCase()}` : ""}`
  : "Choose a level and area of expertise";

function updateTeacherTeachingProfile(field, value) {
  setProfileSaved(false);
  setProfile((previous) => {
    const next = { ...previous, [field]: value };
    if (field === "teachingEducationLevel") {
      next.teachingClassNumber = "";
      next.teachingIntermediateYear = "";
      next.teachingStream = "";
      next.teachingDegreeLevel = "";
      next.teachingProgramChoice = "";
      next.teachingProgram = "";
    }
    if (field === "teachingDegreeLevel") {
      next.teachingProgramChoice = "";
      next.teachingProgram = "";
    }
    if (field === "teachingProgramChoice") {
      next.teachingProgram = value === "Other" ? "" : value;
    }
    return next;
  });
}

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

    if (!updateCourses((previous) =>
      previous.map((item) =>
        item.id === courseId
          ? {
              ...item,
              status: "Pending Approval",
              revisionNotes: "",
            }
          : item
      )
    )) return;

    try {
      appendAdminActivityRecord({
        actor: email,
        actorRole: "Teacher",
        action: "Course Submitted",
        category: "course-review",
        module: "Course Review",
        entityType: "Course",
        entityId: String(course.id),
        targetId: String(course.id),
        targetName: course.title || "Course",
        previousValue: course.status || "Draft",
        newValue: "Pending Approval",
        description: "Teacher submitted a course for Admin review.",
        result: "Success",
      });
    } catch {
      // A local audit write error must not block course submission.
    }

    alert("Course submitted for approval.");
  }

  function publishApprovedCourse(courseId) {
    const course = courses.find((item) => item.id === courseId);
    if (!course || course.status !== "Approved") return;

    if (!(course.lessons || []).length) {
      alert("Add at least one lesson before publishing.");
      navigateTo("lessons");
      return;
    }

    if (!updateCourses((previous) =>
      previous.map((item) =>
        item.id === courseId
          ? { ...item, status: "Published", publishedAt: new Date().toISOString() }
          : item
      )
    )) return;

    try {
      appendAdminActivityRecord({
        actor: email,
        actorRole: "Teacher",
        action: "Course Published",
        category: "course-review",
        module: "Course Review",
        entityType: "Course",
        entityId: String(course.id),
        targetId: String(course.id),
        targetName: course.title || "Course",
        previousValue: "Approved",
        newValue: "Published",
        description: "Teacher published an Admin-approved course.",
        result: "Success",
      });
    } catch {
      // A local audit write error must not block course publishing.
    }

    alert("Course published. It is now available in Explore Courses.");
  }

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
      title: "Total Students",
      description: "Student enrollments saved for your courses in this browser.",
      items: enrolledStudents.map((student) => ({
        id: student.id,
        title: student.name,
        detail: `${student.email} · ${student.courseTitle} · Enrolled ${student.enrolledAt}`,
        status: `${student.progress}% progress`,
        progress: student.progress,
      })),
      emptyMessage: "No student enrollment records are available yet.",
    },
    "demo-courses": {
      title: "Enrolled Courses",
      description: "Your courses with saved student enrollments and progress.",
      items: studentCourses.map((courseTitle) => {
        const courseStudents = enrolledStudents.filter((student) => student.courseTitle === courseTitle);
        const averageCourseProgress = courseStudents.length
          ? Math.round(courseStudents.reduce((total, student) => total + student.progress, 0) / courseStudents.length)
          : 0;
        return {
          id: courseTitle,
          title: courseTitle,
          detail: courseStudents.map((student) => `${student.name} (${student.progress}%)`).join(" · "),
          status: `${courseStudents.length} ${courseStudents.length === 1 ? "student" : "students"}`,
          progress: averageCourseProgress,
        };
      }),
      emptyMessage: "No course enrollments are available yet.",
    },
    "average-progress": {
      title: "Average Progress",
      description: `Average learning progress across your saved course enrollments is ${enrolledStudents.length ? Math.round(enrolledStudents.reduce((total, student) => total + student.progress, 0) / enrolledStudents.length) : 0}%. Individual progress is listed below.`,
      items: [...enrolledStudents].sort((a, b) => a.progress - b.progress).map((student) => ({
        id: student.id,
        title: student.name,
        detail: `${student.courseTitle} · ${student.completedLessons} of ${student.totalLessons} lessons completed`,
        status: `${student.progress}%`,
        progress: student.progress,
      })),
      emptyMessage: "No progress records are available yet.",
    },
  }[teacherStudentDetailSlug];

  const teacherEarningsDetailSlug = location.pathname.startsWith("/teacher/dashboard/earnings/")
    ? location.pathname.split("/").at(-1)
    : "";
  const transactionDetails = records => records.map(record => ({
    id: record.id,
    title: record.course,
    detail: [record.student, record.date].filter(Boolean).join(" / "),
    amount: record.amount,
    status: record.status,
  }));
  const teacherEarningsDetailConfig = {
    "total-earnings": {
      title: "Recorded Course Sales",
      description: "Saved checkout and legacy purchase records for your courses in this browser.",
      items: transactionDetails(transactions),
      emptyMessage: "No course purchase records are available yet.",
    },
    "monthly-earnings": {
      title: currentMonthLabel + " Course Sales",
      description: "Saved course purchase records for the current month.",
      items: transactionDetails(transactions.filter(transaction => transaction.date.startsWith(currentMonthKey))),
      emptyMessage: "No course purchases are recorded for this month.",
    },
    "completed-sales": {
      title: "Recorded Purchases",
      description: completedSales + " course purchase records saved in this browser.",
      items: transactionDetails(transactions),
      emptyMessage: "No course purchase records are available yet.",
    },
  }[teacherEarningsDetailSlug];

  if (requestedCourseId) {
    const course = courses.find(
      (item) => String(item.id) === requestedCourseId
    );

    return (
      <section className="edc-teacher-course-edit-page">
        <div className="edc-teacher-course-edit-content">
          <button
            type="button"
            className="edc-teacher-course-edit-back"
            onClick={closeCourseEditor}
          >
            <ArrowLeft size={17} />
            Back to My Courses
          </button>

          {course ? (
            <>
              {courseStorageError && (
                <p className="edc-teacher-storage-error" role="alert">
                  {courseStorageError}
                </p>
              )}
              <header className="edc-teacher-course-edit-heading">
                <span>COURSE MANAGEMENT</span>
                <h1>Edit Course</h1>
                <p>Update the details for “{course.title}”.</p>
              </header>
              <TeacherCourseEditor
                courseForm={courseForm}
                setCourseForm={setCourseForm}
                editingId={editingId}
                teacherFocusLabel={teacherFocusLabel}
                onSave={saveCourse}
                onCancel={closeCourseEditor}
                onThumbnailUpload={handleThumbnailUpload}
                onRemoveThumbnail={removeThumbnail}
              />
            </>
          ) : (
            <section className="edc-teacher-course-edit-not-found" role="alert">
              <h1>Course not found</h1>
              <p>This course may have been deleted or is no longer available.</p>
              <button type="button" onClick={closeCourseEditor}>
                Return to My Courses
              </button>
            </section>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="edc-teacher-shell">
      {/* MOBILE MENU */}

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
            <strong>EduConnect <b>AI</b></strong>
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
            <strong>{teacherDisplayName}</strong>
            <span style={{ overflowWrap: "anywhere" }}>
              Teacher
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
              {id === "notifications" && unreadNotifications > 0 && <span className="edc-notification-count" aria-label={`${unreadNotifications} unread`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
            </button>
          ))}
        </nav>

        <div className="edc-teacher-sidebar-tip">
          <Crown size={27} fill="currentColor" />
          <strong>Keep Growing</strong>
          <p>Build your courses and share your knowledge.</p>
          <button type="button" onClick={startCreate}>Create Course <ChevronRight size={15} /></button>
        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="edc-teacher-main">
        <TeacherWorkspaceHeader
          profile={{ ...profile, name: teacherDisplayName }}
          courses={courses}
          students={uniqueStudents}
          navigation={navigation}
          unread={unreadNotifications}
          onNavigate={navigateTo}
          onEdit={startEdit}
          onStudent={studentEmail => {
            setStudentSearch(studentEmail);
            setStudentCourseFilter("All");
            navigateTo("students");
          }}
          onLogout={signOut}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        {tab !== "courses" && (
          <header className="edc-teacher-topbar">
            <div>
              <span className="edc-teacher-breadcrumb">
                Teacher Workspace / {teacherEarningsDetailConfig ? `Earnings / ${teacherEarningsDetailConfig.title}` : teacherStudentDetailConfig ? `My Students / ${teacherStudentDetailConfig.title}` : teacherStatDetailConfig ? `Overview / ${teacherStatDetailConfig.title}` : navigation.find(([id]) => id === tab)?.[1]}
              </span>

              {!["reviews", "discussions", "lessons", "analytics", "quizzes", "course-assignments"].includes(tab) && !(tab === "students" && !teacherStudentDetailConfig) && !(tab === "earnings" && !teacherEarningsDetailConfig) && (
                <h2>
                  {teacherEarningsDetailConfig?.title || teacherStudentDetailConfig?.title || teacherStatDetailConfig?.title || navigation.find(([id]) => id === tab)?.[1]}
                </h2>
              )}
            </div>
            <button type="button" className="edc-dashboard-logout" onClick={signOut}>
              <LogOut size={17} /> Log out
            </button>
          </header>
        )}

        {courseStorageError && (
          <p className="edc-teacher-storage-error" role="alert">
            {courseStorageError}
          </p>
        )}

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

        {tab === "overview" && !teacherStatDetailConfig && (
          <TeacherOverview
            email={email}
            profile={{ ...profile, name: teacherDisplayName }}
            courses={courses}
            data={courseAnalytics}
            onNavigate={navigateTo}
            onCreate={startCreate}
            onEdit={startEdit}
            onLessons={course => { setSelectedLessonCourse(course.id); navigateTo("lessons"); }}
          />
        )}

        {/* MY COURSES */}

       
{tab === "analytics" && <InstructorAnalytics email={email} courses={courses} />}
{tab === "quizzes" && <CourseQuizzes role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))} />}
{tab === "course-assignments" && <CourseAssignments role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))} />}
{tab === "curriculum" && <CurriculumBuilder role="teacher" email={email} courses={courses.map(c => ({ ...c, teacherEmail: email }))}
  onAddLesson={(courseId, lesson) => updateCourses(prev => prev.map(c => String(c.id)===String(courseId) ? {...c,lessons:[...(Array.isArray(c.lessons)?c.lessons:[]),lesson]} : c))}
  onReorderLessons={(courseId, orderedIds) => updateCourses(prev => prev.map(c => {
    if(String(c.id)!==String(courseId))return c;
    const old=Array.isArray(c.lessons)?c.lessons:[];
    const picked=orderedIds.map(id=>old.find(l=>String(l.id)===String(id))).filter(Boolean);
    const remaining=old.filter(l=>!orderedIds.some(id=>String(id)===String(l.id)));
    return {...c,lessons:[...picked,...remaining]};
  }))}
/>}
{tab === "books" && <TeacherBooks email={email} profile={profile} />}
{tab === "reviews" && <CourseReviews role="teacher" email={email} courses={courses} />}
{tab === "discussions" && <CourseDiscussions role="teacher" email={email} courses={courses.map(course => ({ ...course, teacherEmail: email }))} />}
{tab === "appeals" && <UserModerationAppeals email={email} name={profile.fullName || profile.name || "Teacher"} role="Teacher" />}
{tab === "help-support" && <UserSupportCenter email={email} name={profile.fullName || profile.name || "Teacher"} role="Teacher" />}
{tab === "notifications" && <NotificationsCenter notifications={notifications} onRead={markNotificationRead} onReadAll={markAllNotificationsRead} onDelete={deleteNotification} onNavigate={navigateTo} audience="teacher" />}

{tab === "courses" && (
  <div className="edc-teacher-courses-page">
    <header className="edc-teacher-courses-heading">
      <div>
        <GraduationCap size={33} aria-hidden="true" />
        <div>
          <h1>My Courses</h1>
          <p>Create, manage and track the performance of your courses.</p>
        </div>
      </div>
      <button type="button" className="edc-teacher-create-course" onClick={startCreate}>
        <Plus size={19} />
        Create New Course
      </button>
    </header>

    <section className="edc-teacher-course-stats" aria-label="Course summary">
      {[
        { label: "Total Courses", value: courses.length, icon: BookOpen, color: "purple" },
        { label: "Total Lessons", value: totalCourseLessons, icon: Layers3, color: "gold" },
        { label: "Total Students", value: uniqueStudents.length, icon: Users, color: "purple" },
        {
          label: "Avg. Rating",
          value: averageCourseRating === null ? "—" : averageCourseRating.toFixed(1),
          suffix: averageCourseRating === null ? "" : "/ 5",
          icon: Star,
          color: "gold",
        },
      ].map(({ label, value, suffix, icon: Icon, color }) => (
        <article className={`edc-teacher-course-stat ${color}`} key={label}>
          <span><Icon size={25} fill={label === "Avg. Rating" ? "currentColor" : "none"} /></span>
          <div>
            <small>{label}</small>
            <strong>{value}{suffix && <em>{suffix}</em>}</strong>
          </div>
        </article>
      ))}
    </section>

    <div className="edc-teacher-course-toolbar">
      <nav className="edc-teacher-course-status-tabs" aria-label="Filter courses by status">
        {courseStatusTabs.map(({ value, label, count }) => (
          <button
            type="button"
            key={value}
            className={statusFilter === value ? "active" : ""}
            aria-pressed={statusFilter === value}
            onClick={() => setStatusFilter(value)}
          >
            {label} <span>({count})</span>
          </button>
        ))}
      </nav>
      <div className="edc-teacher-course-search">
        <Search size={18} />
        <input
          type="search"
          aria-label="Search your courses"
          placeholder="Search your courses..."
          value={courseSearch}
          onChange={event => setCourseSearch(event.target.value)}
        />
      </div>
      <select
        aria-label="Filter courses by category"
        value={categoryFilter}
        onChange={event => setCategoryFilter(event.target.value)}
      >
        <option value="All">All Categories</option>
        <option value="Development">Development</option>
        <option value="Design">Design</option>
        <option value="Business">Business</option>
        <option value="Data Science">Data Science</option>
        <option value="IT & Software">IT & Software</option>
        <option value="Personal Growth">Personal Growth</option>
      </select>
    </div>

    {showForm && (
      <TeacherCourseEditor
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        editingId={editingId}
        teacherFocusLabel={teacherFocusLabel}
        onSave={saveCourse}
        onCancel={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onThumbnailUpload={handleThumbnailUpload}
        onRemoveThumbnail={removeThumbnail}
      />
    )}

    {filteredCourses.length ? (
      <div className="edc-teacher-course-table-wrap">
        <table className="edc-teacher-course-table">
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Students</th>
              <th scope="col">Lessons</th>
              <th scope="col">Rating</th>
              <th scope="col">Status</th>
              <th scope="col">Last Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(course => {
              const status = course.status || "Draft";
              const analytics = courseAnalyticsById.get(String(course.id));
              const ratings = analytics?.ratings || [];
              const courseRating = ratings.length
                ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
                : null;
              const thumbnail = course.thumbnail || course.image;
              const lessonCount = Array.isArray(course.lessons)
                ? course.lessons.length
                : Math.max(0, Number(course.lessons) || 0);
              const statusClass = status === "Published"
                ? "published"
                : status === "Approved"
                  ? "approved"
                  : status === "Pending Approval"
                    ? "pending"
                    : status === "Rejected" || status === "Suspended"
                      ? "rejected"
                      : status === "Changes Requested"
                        ? "changes-requested"
                        : "draft";
              const canSubmit = !["Pending Approval", "Approved", "Published"].includes(status);

              return (
                <tr key={course.id}>
                  <td>
                    <div className="edc-teacher-course-table-item">
                      {thumbnail ? (
                        <img src={thumbnail} alt="" />
                      ) : (
                        <span className="edc-teacher-course-table-placeholder"><BookOpen size={22} /></span>
                      )}
                      <div>
                        <strong>{course.title || "Untitled course"}</strong>
                        <span className="edc-teacher-course-tags">
                          <small>{course.category || "Uncategorized"}</small>
                          <small>{course.level || "Level not set"}</small>
                        </span>
                        {course.revisionNotes && (
                          <span className="edc-teacher-course-revision-inline">{course.revisionNotes}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{analytics?.students || 0}</td>
                  <td>{lessonCount}</td>
                  <td>
                    {courseRating === null ? (
                      <span className="edc-teacher-course-no-rating">—</span>
                    ) : (
                      <span className="edc-teacher-course-rating"><Star size={15} fill="currentColor" />{courseRating.toFixed(1)}</span>
                    )}
                  </td>
                  <td>
                    <span className={`edc-teacher-course-table-status ${statusClass}`}>
                      {status === "Pending Approval" ? "Under Review" : status}
                    </span>
                  </td>
                  <td className="edc-teacher-course-updated">
                    {formatCourseUpdatedAt(course.updatedAt || course.createdAt)}
                  </td>
                  <td>
                    <div className="edc-teacher-course-row-actions">
                      <button
                        type="button"
                        className="edc-teacher-course-icon-action"
                        aria-label={`Edit ${course.title || "course"}`}
                        title="Edit course"
                        onClick={() => startEdit(course)}
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        className="edc-teacher-course-icon-action"
                        aria-label="Open learning analytics"
                        title="Learning analytics"
                        onClick={() => navigateTo("analytics")}
                      >
                        <ChartNoAxesCombined size={17} />
                      </button>
                      <div className="edc-teacher-course-actions-menu">
                        <button
                          type="button"
                          className="edc-teacher-course-icon-action"
                          aria-label={`More actions for ${course.title || "course"}`}
                          aria-haspopup="menu"
                          aria-expanded={openCourseMenu === String(course.id)}
                          onClick={() => setOpenCourseMenu(openCourseMenu === String(course.id) ? "" : String(course.id))}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openCourseMenu === String(course.id) && (
                          <div className="edc-teacher-course-actions-popover" role="menu">
                            <button type="button" role="menuitem" onClick={() => { setOpenCourseMenu(""); navigateTo("lessons"); }}>
                              <BookOpen size={15} /> Manage Lessons
                            </button>
                            <button type="button" role="menuitem" onClick={() => { setOpenCourseMenu(""); setPreviewCourse(course); }}>
                              <ArrowRight size={15} /> Preview Course
                            </button>
                            {status === "Approved" && (
                              <button type="button" role="menuitem" onClick={() => { setOpenCourseMenu(""); publishApprovedCourse(course.id); }}>
                                <CheckCircle2 size={15} /> Publish Course
                              </button>
                            )}
                            {canSubmit && (
                              <button type="button" role="menuitem" onClick={() => { setOpenCourseMenu(""); submitForApproval(course.id); }}>
                                <Send size={15} /> Submit for Approval
                              </button>
                            )}
                            <button type="button" role="menuitem" className="danger" onClick={() => { setOpenCourseMenu(""); deleteCourse(course.id); }}>
                              <Trash2 size={15} /> Delete Course
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <section className="edc-teacher-empty-courses">
        <BookOpen size={40} color="#7042d8" />
        <h3>{courses.length === 0 ? "You have no courses yet" : "No courses found"}</h3>
        <p>
          {courses.length === 0
            ? "Create your first course to get started."
            : "No courses match your search or filters."}
        </p>
        {courses.length === 0 && (
          <button type="button" className="edc-teacher-primary" onClick={startCreate}>
            <Plus size={17} />
            Create Course
          </button>
        )}
      </section>
    )}
  </div>
)}


        {/* LESSONS */}

{tab === "lessons" && (
  <>
    <TeacherLessons
      courses={courses}
      courseAnalytics={courseAnalytics}
      preferredCourseId={selectedLessonCourse}
      onCourseChange={setSelectedLessonCourse}
      onAddLesson={courseId => openLessonForm(courseId)}
      onEditLesson={openLessonForm}
      onDeleteLesson={removeLesson}
      onMoveLesson={moveLesson}
      onCreateCourse={() => { startCreate(); navigateTo("courses"); }}
    />

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
                id="edc-lesson-video"
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
  </>
)}


        {/* STUDENTS */}

      
{/* STUDENTS */}

{tab === "students" && !teacherStudentDetailConfig && (
  <>
    <TeacherStudents
      enrollments={enrolledStudents}
      onViewStudent={setSelectedStudent}
    />

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
              Progress is summarized from this student’s saved course enrollments.
            </p>
          </div>
        </div>
      </div>
    )}
  </>
)}


        {tab === "earnings" && !teacherEarningsDetailConfig && (
          <TeacherEarnings email={email} courses={courses} />
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
                      window.dispatchEvent(new Event("educonnect:teacher-profile-changed"));
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
                    <label htmlFor="edc-profile-expertise">Additional Expertise</label>
                    <input
                      id="edc-profile-expertise"
                      value={teacherExpertise}
                      placeholder="Extra skills, e.g. React, JavaScript, UI/UX"
                      onChange={(event) => {
                        setProfileSaved(false);
                        setProfile((previous) => ({ ...previous, expertise: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-qualification">Qualification</label>
                    <input id="edc-profile-qualification" value={profile.qualification || ""} placeholder="Degree or professional qualification" onChange={(event) => { setProfileSaved(false); setProfile((previous) => ({ ...previous, qualification: event.target.value })); }} />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-experience">Teaching Experience</label>
                    <input id="edc-profile-experience" value={profile.experience || ""} placeholder="e.g. 5 years" onChange={(event) => { setProfileSaved(false); setProfile((previous) => ({ ...previous, experience: event.target.value })); }} />
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-teacher-teaching-level">Teaching Level</label>
                    <select id="edc-teacher-teaching-level" value={teacherTeachingProfile.educationLevel} onChange={(event) => updateTeacherTeachingProfile("teachingEducationLevel", event.target.value)}>
                      <option value="">Select a teaching level</option>
                      <option value="school">School</option>
                      <option value="intermediate">College / Intermediate</option>
                      <option value="university">University</option>
                      <option value="online">Interest / Online Courses</option>
                    </select>
                  </div>
                  {teacherTeachingProfile.educationLevel === "school" && <div className="edc-profile-field">
                    <label htmlFor="edc-teacher-class">Class</label>
                    <select id="edc-teacher-class" value={teacherTeachingProfile.classNumber} onChange={(event) => updateTeacherTeachingProfile("teachingClassNumber", event.target.value)}>
                      <option value="">Select a class</option>
                      {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>Class {index + 1}</option>)}
                    </select>
                  </div>}
                  {teacherTeachingProfile.educationLevel === "intermediate" && <>
                    <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-intermediate-year">Year</label>
                      <select id="edc-teacher-intermediate-year" value={teacherTeachingProfile.intermediateYear} onChange={(event) => updateTeacherTeachingProfile("teachingIntermediateYear", event.target.value)}>
                        <option value="">Select a year</option><option value="1">1st Year</option><option value="2">2nd Year</option>
                      </select>
                    </div>
                    <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-intermediate-stream">College Program / Group</label>
                      <select id="edc-teacher-intermediate-stream" value={teacherTeachingProfile.stream} onChange={(event) => updateTeacherTeachingProfile("teachingStream", event.target.value)}>
                        <option value="">Select a group</option>{INTERMEDIATE_STREAMS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </div>
                  </>}
                  {teacherTeachingProfile.educationLevel === "university" && <>
                    <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-degree-level">Degree Level</label>
                      <select id="edc-teacher-degree-level" value={teacherTeachingProfile.degreeLevel} onChange={(event) => updateTeacherTeachingProfile("teachingDegreeLevel", event.target.value)}>
                        <option value="">Select a degree level</option><option value="bs">BS / Bachelor's</option><option value="masters">Master's</option><option value="phd">PhD</option>
                      </select>
                    </div>
                    {teacherTeachingProfile.degreeLevel && <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-program">{teacherTeachingProfile.degreeLevel === "bs" ? "BS / Bachelor's Program" : teacherTeachingProfile.degreeLevel === "masters" ? "Master's Program" : "PhD Program"}</label>
                      <select id="edc-teacher-program" value={teacherTeachingProfile.programChoice} onChange={(event) => updateTeacherTeachingProfile("teachingProgramChoice", event.target.value)}>
                        <option value="">Select a program</option>{getProgramGroupsForDegreeLevel(teacherTeachingProfile.degreeLevel).map((group) => <optgroup key={group.label} label={group.label}>{group.programs.map((program) => <option key={program} value={program}>{program}</option>)}</optgroup>)}<option value="Other">Other</option>
                      </select>
                    </div>}
                    {teacherTeachingProfile.programChoice === "Other" && <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-custom-program">Enter Program</label>
                      <input id="edc-teacher-custom-program" maxLength={100} value={teacherTeachingProfile.program} onChange={(event) => updateTeacherTeachingProfile("teachingProgram", event.target.value)} placeholder="Type the program name" />
                    </div>}
                  </>}
                  {teacherTeachingProfile.educationLevel === "online" && <>
                    <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-online-interest">Interest / Course Area</label>
                      <select id="edc-teacher-online-interest" value={teacherTeachingProfile.programChoice} onChange={(event) => updateTeacherTeachingProfile("teachingProgramChoice", event.target.value)}>
                        <option value="">Select an interest</option>{ONLINE_COURSES.map((course) => <option key={course} value={course}>{course}</option>)}
                      </select>
                    </div>
                    {teacherTeachingProfile.programChoice === "Other" && <div className="edc-profile-field">
                      <label htmlFor="edc-teacher-custom-interest">Enter Course Area</label>
                      <input id="edc-teacher-custom-interest" maxLength={100} value={teacherTeachingProfile.program} onChange={(event) => updateTeacherTeachingProfile("teachingProgram", event.target.value)} placeholder="Type the course area" />
                    </div>}
                  </>}
                  <div className="edc-profile-subject-preview">
                    <strong>Subjects and courses you teach</strong>
                    <p>{teacherFocusSubjects.length ? teacherFocusSubjects.join(" · ") : teacherFocusComplete ? (teacherExpertise || "Add additional expertise above.") : "Select your teaching level and specialization to see related subjects."}</p>
                  </div>
                  <div className="edc-profile-field">
                    <label htmlFor="edc-profile-availability">Availability</label>
                    <select id="edc-profile-availability" value={profile.availability || "Available"} onChange={(event) => { setProfileSaved(false); setProfile((previous) => ({ ...previous, availability: event.target.value })); }}><option>Available</option><option>Busy</option><option>Unavailable</option></select>
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
                    <strong>Teaching Focus</strong>
                    <p>{teacherFocusLabel}</p>
                  </div>
                  {teacherFocusSubjects.length > 0 && <div className="edc-profile-preview-detail">
                    <strong>Subjects You Teach</strong>
                    <p>{teacherFocusSubjects.join(" · ")}</p>
                  </div>}
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
