
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Brain,
  Bot,
  Users,
  Heart,
  Award,
  Microscope,
  GraduationCap,
  Search,
  Bell,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Menu,
  X,
  Star,
  Video,
  LockKeyhole,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  UserRound,
  Camera,
  Save,
  Pencil,
  Mail,
  MapPin,
  Phone,
  LogOut,
} from "lucide-react";
import "./Dashboard.css";

const COURSES = [
  {
    id: "demo-react",
    title: "React Frontend Development",
    category: "Development",
    instructor: "EduConnect Demo",
    lessons: 10,
    icon: "⚛️",
    color: "purple",
  },
  {
    id: "demo-python",
    title: "Python Programming Basics",
    category: "Programming",
    instructor: "EduConnect Demo",
    lessons: 12,
    icon: "🐍",
    color: "blue",
  },
  {
    id: "demo-design",
    title: "UI/UX Design Fundamentals",
    category: "Design",
    instructor: "EduConnect Demo",
    lessons: 8,
    icon: "🎨",
    color: "pink",
  },
];


const DEMO_ASSIGNMENTS = [
  { id: "react-task", courseId: "demo-react", title: "Build a React Component", description: "Create a reusable React component with props and explain how it works.", points: 100 },
  { id: "python-task", courseId: "demo-python", title: "Practice Python Functions", description: "Write two Python functions and explain their inputs and outputs.", points: 100 },
  { id: "design-task", courseId: "demo-design", title: "Mobile App Wireframe", description: "Describe a mobile app wireframe with at least three screens.", points: 100 },
];

const DEMO_QUIZZES = [
  { id: "react-quiz", courseId: "demo-react", title: "React Basics Quiz", questions: [
    { question: "What is a React component?", options: ["A reusable piece of UI", "A database", "A CSS property", "A server"], correct: 0 },
    { question: "Which hook manages component state?", options: ["useEffect", "useState", "useMemo", "useRef"], correct: 1 },
    { question: "What are props used for?", options: ["Installing packages", "Passing data to components", "Starting a server", "Creating databases"], correct: 1 },
  ] },
  { id: "python-quiz", courseId: "demo-python", title: "Python Basics Quiz", questions: [
    { question: "Which keyword defines a Python function?", options: ["function", "def", "func", "create"], correct: 1 },
    { question: "Which type stores True or False?", options: ["str", "list", "bool", "int"], correct: 2 },
    { question: "Which symbol starts a Python comment?", options: ["#", "//", "<!--", "@"], correct: 0 },
  ] },
  { id: "design-quiz", courseId: "demo-design", title: "UI/UX Basics Quiz", questions: [
    { question: "What does UX stand for?", options: ["User Experience", "Universal Extension", "User Execution", "Unique Example"], correct: 0 },
    { question: "What is a wireframe?", options: ["A programming language", "A basic interface layout", "A database", "A payment method"], correct: 1 },
    { question: "What is the purpose of usability testing?", options: ["Increase file size", "Find user experience problems", "Remove colors", "Install software"], correct: 1 },
  ] },
];

// Topic tags are used only when question-level quiz answers are available.
const QUIZ_TOPICS = {
  "react-quiz": ["Components", "React Hooks", "Props"],
  "python-quiz": ["Functions", "Data Types", "Comments"],
  "design-quiz": ["UX Fundamentals", "Wireframing", "Usability Testing"],
};

// Fictional tutor profiles and sample availability for the frontend demo.
const DEMO_TUTORS = [
  { id: "tutor-react", name: "Areeba Khan", subject: "React & JavaScript", level: "Beginner", experience: "4 years (demo)", rating: 4.9, about: "Learn frontend fundamentals with practical projects.", initials: "AK", slots: ["Mon 4:00 PM", "Wed 5:00 PM", "Sat 11:00 AM"] },
  { id: "tutor-python", name: "Hamza Ali", subject: "Python Programming", level: "Beginner", experience: "3 years (demo)", rating: 4.8, about: "Build confidence with Python exercises and examples.", initials: "HA", slots: ["Tue 3:00 PM", "Thu 6:00 PM", "Sun 12:00 PM"] },
  { id: "tutor-design", name: "Sara Malik", subject: "UI/UX Design", level: "Intermediate", experience: "5 years (demo)", rating: 4.9, about: "Explore wireframes, prototyping, and design thinking.", initials: "SM", slots: ["Mon 6:00 PM", "Fri 4:00 PM", "Sat 2:00 PM"] },
];

const MENU = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "learning", label: "My Learning", icon: BookOpen },
  { id: "planner", label: "Study Planner", icon: CalendarDays },
  { id: "assignments", label: "Assignments & Grades", icon: ClipboardList },
  { id: "mastery", label: "Topic Mastery", icon: Brain },
  { id: "ai", label: "AI Tutor", icon: Bot },
  { id: "tutors", label: "Hire a Tutor", icon: Users },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "portfolio", label: "Certificates & Portfolio", icon: Award },
  { id: "research", label: "Research Workspace", icon: Microscope },
  { id: "profile", label: "My Profile", icon: UserRound },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function ProgressBar({ value = 0 }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="edc-progress-track">
      <div
        className="edc-progress-fill"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="edc-section-heading">
      <div>
        {eyebrow && <span className="edc-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, description }) {
  return (
    <div className="edc-empty">
      <div className="edc-empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function StudentDashboard({ email = "student" }) {
  const baseKey = `educonnect.student.${email}`;
  const location = useLocation();
  const navigate = useNavigate();

  function signOut() {
    window.sessionStorage.removeItem("educonnect.demoEmail");
    window.sessionStorage.removeItem("educonnect.demoRole");
    navigate("/login", { replace: true });
  }

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [playerCourseId, setPlayerCourseId] = useState(null);
  const [playerLessonIndex, setPlayerLessonIndex] = useState(0);

  const [studentProfile, setStudentProfile] = useState(() =>
    readStorage(`${baseKey}.profile`, {
      fullName: "", phone: "", city: "", about: "", avatar: "",
    })
  );
  const [profileDraft, setProfileDraft] = useState(() =>
    readStorage(`${baseKey}.profile`, {
      fullName: "", phone: "", city: "", about: "", avatar: "",
    })
  );
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const profileDisplayName = studentProfile.fullName?.trim() || "Student";

  useEffect(() => {
    try {
      localStorage.setItem(`${baseKey}.profile`, JSON.stringify(studentProfile));
    } catch {
      setProfileNotice("Profile image may be too large for browser storage. Try a smaller photo.");
    }
  }, [baseKey, studentProfile]);

  function beginProfileEdit() {
    setProfileDraft({ ...studentProfile });
    setEditingProfile(true);
    setProfileNotice("");
  }

  function saveStudentProfile(event) {
    event.preventDefault();
    const fullName = profileDraft.fullName.trim();
    if (fullName.length < 2) {
      setProfileNotice("Please enter your full name (at least 2 characters).");
      return;
    }
    setStudentProfile({
      fullName: fullName.slice(0, 80),
      phone: profileDraft.phone.trim().slice(0, 25),
      city: profileDraft.city.trim().slice(0, 80),
      about: profileDraft.about.trim().slice(0, 500),
      avatar: profileDraft.avatar || "",
    });
    setEditingProfile(false);
    setProfileNotice("Profile saved in this browser.");
  }

  function uploadStudentAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileNotice("Please select a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setProfileNotice("Please choose an image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileDraft((previous) => ({ ...previous, avatar: reader.result }));
        setProfileNotice("Photo selected. Click Save Changes to keep it.");
      }
    };
    reader.onerror = () => setProfileNotice("Could not read the selected image.");
    reader.readAsDataURL(file);
  }

  function ProfileAvatar({ image, size = "large" }) {
    return (
      <span className={`edc-student-profile-avatar edc-student-profile-avatar-${size}`}>
        {image ? <img src={image} alt="Student profile" /> : <UserRound size={size === "large" ? 46 : 20} />}
      </span>
    );
  }


  const [enrollments, setEnrollments] = useState(() =>
    readStorage(`${baseKey}.enrollments`, [])
  );

  const [wishlist, setWishlist] = useState(() =>
    readStorage(`${baseKey}.wishlist`, [])
  );

  const [dailyGoals, setDailyGoals] = useState(() =>
    readStorage(`${baseKey}.dailyGoals`, [
      { id: 1, title: "Complete one lesson", done: false },
      { id: 2, title: "Review your course progress", done: false },
      { id: 3, title: "Plan tomorrow's learning", done: false },
    ])
  );

  const [newGoal, setNewGoal] = useState("");

  // Portfolio demo data is stored locally for the current student.
  const [portfolioTab, setPortfolioTab] = useState("certificates");
  const [portfolioName, setPortfolioName] = useState(() =>
    readStorage(`${baseKey}.portfolioName`, "")
  );
  const [portfolioProjects, setPortfolioProjects] = useState(() =>
    readStorage(`${baseKey}.portfolioProjects`, [])
  );
  const [projectForm, setProjectForm] = useState({ id: null, title: "", description: "", skills: "", url: "" });
  const [projectEditing, setProjectEditing] = useState(false);
  const [portfolioMessage, setPortfolioMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(`${baseKey}.portfolioName`, JSON.stringify(portfolioName));
  }, [baseKey, portfolioName]);
  useEffect(() => {
    localStorage.setItem(`${baseKey}.portfolioProjects`, JSON.stringify(portfolioProjects));
  }, [baseKey, portfolioProjects]);

  function savePortfolioProject(event) {
    event.preventDefault();
    const title = projectForm.title.trim();
    const description = projectForm.description.trim();
    if (title.length < 3 || description.length < 10) {
      setPortfolioMessage("Project title (3+ characters) and description (10+ characters) are required.");
      return;
    }
    const url = projectForm.url.trim();
    if (url) {
      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      } catch {
        setPortfolioMessage("Enter a valid http:// or https:// project link.");
        return;
      }
    }
    const project = {
      id: projectForm.id || `project-${Date.now()}`,
      title,
      description,
      skills: projectForm.skills.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 12),
      url,
      updatedAt: new Date().toISOString(),
    };
    setPortfolioProjects((previous) =>
      projectForm.id ? previous.map((item) => item.id === project.id ? project : item) : [project, ...previous]
    );
    setProjectForm({ id: null, title: "", description: "", skills: "", url: "" });
    setProjectEditing(false);
    setPortfolioMessage(projectForm.id ? "Project updated in this browser." : "Project saved in this browser.");
  }

  function editPortfolioProject(project) {
    setProjectForm({ ...project, skills: project.skills.join(", ") });
    setProjectEditing(true);
    setPortfolioMessage("");
  }

  function deletePortfolioProject(id) {
    if (!window.confirm("Delete this project from your demo portfolio?")) return;
    setPortfolioProjects((previous) => previous.filter((item) => item.id !== id));
    setPortfolioMessage("Project deleted.");
  }

  function printDemoCertificate(course) {
    const name = portfolioName.trim();
    if (!name) {
      setPortfolioTab("certificates");
      setPortfolioMessage("Enter your name above before creating a demo certificate.");
      return;
    }
    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
    const popup = window.open("", "_blank", "width=980,height=760");
    if (!popup) {
      setPortfolioMessage("Please allow pop-ups to preview and print your demo certificate.");
      return;
    }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Demo Completion Record</title>
      <style>body{font-family:Arial,sans-serif;margin:0;background:#f4f0ff;color:#282044}
      .sheet{box-sizing:border-box;width:95%;max-width:1000px;margin:30px auto;background:white;border:15px solid #7653cb;padding:60px 35px;text-align:center;min-height:590px}
      .brand{font-size:23px;color:#7653cb;font-weight:800}.heading{font-size:38px;margin:45px 0 10px}
      .name{font-size:34px;color:#7653cb;font-weight:bold;margin:18px}.course{font-size:26px;font-weight:700;margin:18px}
      .disclaimer{font-size:15px;color:#6c6680;margin-top:60px}.print{display:block;margin:10px auto;padding:12px 25px;border:0;border-radius:9px;background:#7653cb;color:white;cursor:pointer}
      @media print{body{background:white}.sheet{margin:0;width:100%;max-width:none;min-height:95vh}.print{display:none}@page{size:landscape;margin:8mm}}</style></head>
      <body><button class="print" onclick="window.print()">Print / Save as PDF</button><main class="sheet">
      <div class="brand">EduConnect AI</div><div class="heading">Demo Course Completion Record</div>
      <p>This demo record recognizes</p><div class="name">${escapeHtml(name)}</div>
      <p>for completing all sample lessons in</p><div class="course">${escapeHtml(course.title)}</div>
      <p>Completion progress: 100%</p><p class="disclaimer">Frontend demonstration only · Not an accredited or verified certificate</p>
      </main></body></html>`);
    popup.document.close();
    setPortfolioMessage("Certificate preview opened. Choose Print / Save as PDF in the new tab.");
  }


  // Research Workspace: browser-only records. No papers, experiments or citations are verified.
  const RESEARCH_SECTIONS = [
    { id: "projects", title: "Research Projects", fields: [{key:"title",label:"Project title",required:true},{key:"question",label:"Research question",multiline:true},{key:"status",label:"Status",options:["Planning","In Progress","Completed"]},{key:"notes",label:"Notes",multiline:true}] },
    { id: "papers", title: "Paper Library", fields: [{key:"title",label:"Paper title",required:true},{key:"authors",label:"Authors"},{key:"year",label:"Publication year"},{key:"url",label:"Paper link (https://...)"},{key:"summary",label:"Summary / key findings",multiline:true}] },
    { id: "matrix", title: "Literature Review Matrix", fields: [{key:"title",label:"Study / paper title",required:true},{key:"method",label:"Methodology"},{key:"findings",label:"Main findings",multiline:true},{key:"limitations",label:"Limitations",multiline:true},{key:"gap",label:"Research gap",multiline:true}] },
    { id: "references", title: "References & Citations", fields: [{key:"title",label:"Reference title",required:true},{key:"authors",label:"Authors"},{key:"year",label:"Year"},{key:"source",label:"Journal / publisher / source"},{key:"doi",label:"DOI or link"},{key:"notes",label:"Citation notes",multiline:true}] },
    { id: "datasets", title: "Datasets", fields: [{key:"title",label:"Dataset name",required:true},{key:"source",label:"Source"},{key:"url",label:"Dataset link (https://...)"},{key:"format",label:"Format (CSV, JSON, etc.)"},{key:"description",label:"Description",multiline:true}] },
    { id: "experiments", title: "Experiment Tracking", fields: [{key:"title",label:"Experiment name",required:true},{key:"date",label:"Experiment date",type:"date"},{key:"hypothesis",label:"Hypothesis",multiline:true},{key:"method",label:"Method / procedure",multiline:true},{key:"results",label:"Results / observations",multiline:true},{key:"status",label:"Status",options:["Planned","Running","Completed"]}] },
  ];
  const [researchTab, setResearchTab] = useState("projects");
  const [researchRecords, setResearchRecords] = useState(() => readStorage(`${baseKey}.researchRecords`, {}));
  const [researchForm, setResearchForm] = useState({});
  const [researchEditId, setResearchEditId] = useState(null);
  const [researchSearch, setResearchSearch] = useState("");
  const [researchNotice, setResearchNotice] = useState("");
  useEffect(() => {
    localStorage.setItem(`${baseKey}.researchRecords`, JSON.stringify(researchRecords));
  }, [baseKey, researchRecords]);
  const currentResearchSection = RESEARCH_SECTIONS.find((section) => section.id === researchTab) || RESEARCH_SECTIONS[0];
  const researchItems = Array.isArray(researchRecords[researchTab]) ? researchRecords[researchTab] : [];
  const filteredResearchItems = researchItems.filter((item) =>
    Object.values(item).some((value) => String(value ?? "").toLowerCase().includes(researchSearch.toLowerCase()))
  );
  function switchResearchTab(id) {
    setResearchTab(id); setResearchForm({}); setResearchEditId(null); setResearchSearch(""); setResearchNotice("");
  }
  function saveResearchRecord(event) {
    event.preventDefault();
    const cleaned = {};
    currentResearchSection.fields.forEach((field) => { cleaned[field.key] = String(researchForm[field.key] ?? "").trim(); });
    if (!cleaned.title || cleaned.title.length < 3) { setResearchNotice("Please enter a title of at least 3 characters."); return; }
    for (const field of currentResearchSection.fields) {
      if (field.key === "url" && cleaned.url) {
        try { const u = new URL(cleaned.url); if (!["http:", "https:"].includes(u.protocol)) throw new Error("Invalid URL"); }
        catch { setResearchNotice("Please enter a valid http:// or https:// link."); return; }
      }
    }
    const record = { ...cleaned, id: researchEditId || `research-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, updatedAt: new Date().toISOString() };
    setResearchRecords((previous) => {
      const list = Array.isArray(previous[researchTab]) ? previous[researchTab] : [];
      return { ...previous, [researchTab]: researchEditId ? list.map((item) => item.id === researchEditId ? record : item) : [record, ...list] };
    });
    setResearchForm({}); setResearchEditId(null);
    setResearchNotice(researchEditId ? "Record updated in this browser." : "Record saved in this browser.");
  }
  function editResearchRecord(item) {
    setResearchEditId(item.id); setResearchForm({ ...item }); setResearchNotice("Editing selected record.");
  }
  function deleteResearchRecord(id, sectionId = researchTab) {
    if (!window.confirm("Delete this research record from this browser?")) return;
    setResearchRecords((previous) => ({ ...previous, [sectionId]: (previous[sectionId] || []).filter((item) => item.id !== id) }));
    if (researchEditId === id) { setResearchEditId(null); setResearchForm({}); }
    setResearchNotice("Record deleted.");
  }

  // AI Tutor interface demo. Responses are fixed learning templates, not AI-generated.
  const AI_MODES = ["Explain Simply", "Step-by-Step", "Practice Mode", "Exam Preparation", "Study Roadmap"];
  const [aiMode, setAiMode] = useState("Explain Simply");
  const [aiInput, setAiInput] = useState("");
  const [aiHistory, setAiHistory] = useState(() =>
    readStorage(`${baseKey}.aiTutorHistory`, [])
  );
  useEffect(() => {
    localStorage.setItem(`${baseKey}.aiTutorHistory`, JSON.stringify(aiHistory));
  }, [baseKey, aiHistory]);

  function demoTutorReply(topic, mode) {
    const subject = topic.trim().slice(0, 140);
    if (mode === "Explain Simply")
      return `Demo learning guide for “${subject}”:\n1. Write a one-sentence definition of this topic.\n2. Identify its main purpose.\n3. Find one beginner-friendly example in your course notes.\n4. Explain it back in your own words.\n\nThis is a general study template, not an AI-generated explanation of your specific question.`;
    if (mode === "Step-by-Step")
      return `Demo step-by-step plan for “${subject}”:\nStep 1: List what you already know.\nStep 2: Break the topic into 3 small parts.\nStep 3: Study one example for each part.\nStep 4: Try an exercise without notes.\nStep 5: Review mistakes and repeat.\n\nSpecific topic guidance will be available after AI integration.`;
    if (mode === "Practice Mode")
      return `Demo practice for “${subject}”:\nQ1. How would you define this topic?\nQ2. Where might you use it?\nQ3. Can you give an example?\n\nWrite your answers in a notebook and compare them with your course material. Automatic answer checking is not connected yet.`;
    if (mode === "Exam Preparation")
      return `Demo exam revision for “${subject}”:\n• Review key terms and definitions.\n• Make 5 flashcards.\n• Practice 3 questions without notes.\n• Revisit the concepts you missed.\n• Test yourself again tomorrow.\n\nThis is a study checklist, not a generated exam answer.`;
    return `Demo study roadmap for “${subject}”:\nDay 1: Learn the core definitions.\nDay 2: Study examples.\nDay 3: Complete practice exercises.\nDay 4: Review mistakes.\nDay 5: Take a short self-test.\n\nCustomize this plan to your course and available study time.`;
  }

  function sendAiMessage(event) {
    event.preventDefault();
    const question = aiInput.trim();
    if (!question) return;
    const now = Date.now();
    setAiHistory((previous) => [...previous, {
      id: `${now}-user`, role: "user", text: question, mode: aiMode,
    }, {
      id: `${now}-demo`, role: "demo", text: demoTutorReply(question, aiMode), mode: aiMode,
    }].slice(-60));
    setAiInput("");
  }

  function clearAiHistory() {
    if (window.confirm("Clear your demo AI Tutor chat history?")) setAiHistory([]);
  }


  // Tutor discovery and booking requests: saved only in this browser.
  const [tutorSearch, setTutorSearch] = useState("");
  const [tutorSubject, setTutorSubject] = useState("All Subjects");
  const [tutorTab, setTutorTab] = useState("find");
  const [bookingTutorId, setBookingTutorId] = useState(null);
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [tutorNotice, setTutorNotice] = useState("");
  const [tutorBookings, setTutorBookings] = useState(() =>
    readStorage(`${baseKey}.tutorBookings`, [])
  );
  useEffect(() => {
    localStorage.setItem(`${baseKey}.tutorBookings`, JSON.stringify(tutorBookings));
  }, [baseKey, tutorBookings]);

  const matchingTutors = DEMO_TUTORS.filter((tutor) =>
    (tutorSubject === "All Subjects" || tutor.subject === tutorSubject) &&
    `${tutor.name} ${tutor.subject} ${tutor.level}`.toLowerCase().includes(tutorSearch.trim().toLowerCase())
  );
  const bookingTutor = DEMO_TUTORS.find((tutor) => tutor.id === bookingTutorId);

  function saveTutorBooking(event) {
    event.preventDefault();
    if (!bookingTutor || !bookingTutor.slots.includes(bookingSlot)) {
      setTutorNotice("Please select a demo time slot.");
      return;
    }
    const exists = tutorBookings.some((item) =>
      item.tutorId === bookingTutor.id && item.slot === bookingSlot && item.status !== "Cancelled"
    );
    if (exists) {
      setTutorNotice("You already requested this demo session.");
      return;
    }
    setTutorBookings((previous) => [...previous, {
      id: `${Date.now()}-${bookingTutor.id}`,
      tutorId: bookingTutor.id,
      slot: bookingSlot,
      note: bookingNote.trim().slice(0, 300),
      status: "Demo Request",
      createdAt: new Date().toISOString(),
    }]);
    setBookingTutorId(null);
    setBookingSlot("");
    setBookingNote("");
    setTutorTab("sessions");
    setTutorNotice("Demo booking request saved in your browser. No real tutor has been contacted.");
  }

  function cancelTutorBooking(id) {
    if (!window.confirm("Cancel this demo booking request?")) return;
    setTutorBookings((previous) => previous.map((item) =>
      item.id === id ? { ...item, status: "Cancelled" } : item
    ));
    setTutorNotice("Demo booking cancelled.");
  }

  // Academic workspace: browser-only demo, not teacher-connected.
  const [academicTab, setAcademicTab] = useState("assignments");
  const [academicSearch, setAcademicSearch] = useState("");
  const [academicRecords, setAcademicRecords] = useState(() =>
    readStorage(`${baseKey}.academicData`, { submissions: {}, quizResults: {} })
  );
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [academicMessage, setAcademicMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(`${baseKey}.academicData`, JSON.stringify(academicRecords));
  }, [baseKey, academicRecords]);

  const submissions = academicRecords.submissions || {};
  const quizResults = academicRecords.quizResults || {};
  const availableAssignments = DEMO_ASSIGNMENTS.filter((task) =>
    enrollments.some((course) => course.id === task.courseId)
  );
  const availableQuizzes = DEMO_QUIZZES.filter((quiz) =>
    enrollments.some((course) => course.id === quiz.courseId)
  );
  const submittedCount = availableAssignments.filter((task) => submissions[task.id]).length;
  const attemptedQuizzes = availableQuizzes.filter((quiz) => quizResults[quiz.id]);
  const averageQuizScore = attemptedQuizzes.length
    ? Math.round(attemptedQuizzes.reduce((total, quiz) => total + quizResults[quiz.id].percentage, 0) / attemptedQuizzes.length)
    : null;

  const masteryRecords = availableQuizzes.map((quiz) => {
    const course = COURSES.find((item) => item.id === quiz.courseId);
    const result = quizResults[quiz.id];
    const topics = QUIZ_TOPICS[quiz.id] || [];
    const hasAnswerEvidence = result && result.answers && typeof result.answers === "object";
    return {
      quiz,
      course,
      result,
      topics: quiz.questions.map((question, index) => ({
        title: topics[index] || `Topic ${index + 1}`,
        question: question.question,
        status: !hasAnswerEvidence || result.answers[index] === undefined
          ? "not-recorded"
          : Number(result.answers[index]) === question.correct ? "correct" : "revise",
      })),
    };
  });

  const assessedMastery = masteryRecords.filter((record) => record.result);
  const passedQuizzes = availableQuizzes.filter((quiz) => quizResults[quiz.id]?.percentage >= 70);
  const masteryAverage = assessedMastery.length
    ? Math.round(assessedMastery.reduce((sum, record) => sum + (Number(record.result.percentage) || 0), 0) / assessedMastery.length)
    : null;
  const topicsToRevise = masteryRecords.flatMap((record) =>
    record.topics.filter((topic) => topic.status === "revise")
      .map((topic) => ({ ...topic, course: record.course?.title || "Course", quizId: record.quiz.id }))
  );
  const portfolioSkills = [...new Set(portfolioProjects.flatMap((project) => project.skills))];

  function reviewMasteryQuiz(quizId) {
    setAcademicTab("quizzes");
    setSelectedQuiz(null);
    setAcademicMessage("");
    setActiveTab("assignments");
    // The student can select the relevant quiz and retake it.
  }

  function openAssignment(task) {
    setSelectedAssignment(task.id);
    setAssignmentAnswer(submissions[task.id]?.answer || "");
    setAcademicMessage("");
  }

  function submitAssignment(event) {
    event.preventDefault();
    if (!selectedAssignment) return;
    if (assignmentAnswer.trim().length < 20) {
      setAcademicMessage("Please write at least 20 characters.");
      return;
    }
    setAcademicRecords((previous) => ({
      ...previous,
      submissions: {
        ...(previous.submissions || {}),
        [selectedAssignment]: { answer: assignmentAnswer.trim(), submittedAt: new Date().toISOString() },
      },
    }));
    setAcademicMessage("Demo assignment saved in this browser.");
  }

  function startQuiz(id) {
    setSelectedQuiz(id);
    setQuizAnswers({});
    setAcademicMessage("");
  }

  function submitQuiz(event) {
    event.preventDefault();
    const quiz = DEMO_QUIZZES.find((item) => item.id === selectedQuiz);
    if (!quiz) return;
    if (!quiz.questions.every((_, index) => quizAnswers[index] !== undefined)) {
      setAcademicMessage("Please answer every question.");
      return;
    }
    const correct = quiz.questions.filter((question, index) => quizAnswers[index] === question.correct).length;
    const percentage = Math.round((correct / quiz.questions.length) * 100);
    setAcademicRecords((previous) => ({
      ...previous,
      quizResults: {
        ...(previous.quizResults || {}),
        [quiz.id]: { correct, total: quiz.questions.length, percentage, answers: { ...quizAnswers }, completedAt: new Date().toISOString() },
      },
    }));
    setSelectedQuiz(null);
    setQuizAnswers({});
    setAcademicMessage(`Quiz completed! Your score: ${percentage}%.`);
  }


  useEffect(() => {
    localStorage.setItem(
      `${baseKey}.enrollments`,
      JSON.stringify(enrollments)
    );
  }, [baseKey, enrollments]);

  useEffect(() => {
    localStorage.setItem(
      `${baseKey}.wishlist`,
      JSON.stringify(wishlist)
    );
  }, [baseKey, wishlist]);

  useEffect(() => {
    localStorage.setItem(
      `${baseKey}.dailyGoals`,
      JSON.stringify(dailyGoals)
    );
  }, [baseKey, dailyGoals]);

  const enrolledCourses = useMemo(
    () =>
      enrollments
        .map((item) => {
          const course = COURSES.find((c) => c.id === item.id);
          if (!course) return null;

          const completed = Math.min(
            course.lessons,
            Math.max(0, Number(item.completedLessons) || 0)
          );

          return {
            ...course,
            completedLessons: completed,
            progress: Math.round((completed / course.lessons) * 100),
          };
        })
        .filter(Boolean),
    [enrollments]
  );

  const completedCourses = enrolledCourses.filter(
    (course) => course.progress === 100
  );

  const averageProgress = enrolledCourses.length
    ? Math.round(
        enrolledCourses.reduce((sum, course) => sum + course.progress, 0) /
          enrolledCourses.length
      )
    : 0;

  const goalProgress = dailyGoals.length
    ? Math.round(
        (dailyGoals.filter((goal) => goal.done).length /
          dailyGoals.length) *
          100
      )
    : 0;

  const filteredCourses = COURSES.filter((course) =>
    `${course.title} ${course.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function enrollCourse(id) {
    if (enrollments.some((item) => item.id === id)) {
      setActiveTab("learning");
      return;
    }

    setEnrollments((previous) => [
      ...previous,
      { id, completedLessons: 0 },
    ]);

    setActiveTab("learning");
  }

  function updateLesson(id, amount) {
    const course = COURSES.find((item) => item.id === id);
    if (!course) return;

    setEnrollments((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              completedLessons: Math.min(
                course.lessons,
                Math.max(
                  0,
                  (Number(item.completedLessons) || 0) + amount
                )
              ),
            }
          : item
      )
    );
  }

  function openCoursePlayer(courseId) {
    const enrollment = enrollments.find((item) => item.id === courseId);
    if (!enrollment) return;
    setPlayerCourseId(courseId);
    setPlayerLessonIndex(Math.max(0, Number(enrollment.completedLessons) || 0));
    setActiveTab("player");
    setMobileMenu(false);
  }

  function completePlayerLesson() {
    if (!playerCourseId) return;
    const course = COURSES.find((item) => item.id === playerCourseId);
    const enrollment = enrollments.find((item) => item.id === playerCourseId);
    if (!course || !enrollment) return;
    const completed = Math.max(0, Number(enrollment.completedLessons) || 0);
    // Sequential demo completion keeps the existing count-based storage compatible.
    if (playerLessonIndex !== completed || completed >= course.lessons) return;
    updateLesson(playerCourseId, 1);
    if (playerLessonIndex + 1 < course.lessons) {
      setPlayerLessonIndex(playerLessonIndex + 1);
    }
  }

  function removeEnrollment(id) {
    if (!window.confirm("Remove this demo enrollment?")) return;

    setEnrollments((previous) =>
      previous.filter((item) => item.id !== id)
    );
    if (playerCourseId === id) {
      setPlayerCourseId(null);
      setActiveTab("learning");
    }
  }

  function toggleWishlist(id) {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function toggleGoal(id) {
    setDailyGoals((previous) =>
      previous.map((goal) =>
        goal.id === id ? { ...goal, done: !goal.done } : goal
      )
    );
  }

  function addGoal(event) {
    event.preventDefault();

    const title = newGoal.trim();
    if (!title) return;

    setDailyGoals((previous) => [
      ...previous,
      { id: Date.now(), title, done: false },
    ]);

    setNewGoal("");
  }

  function navigateTo(tab) {
    setActiveTab(tab);
    setMobileMenu(false);
    if (location.pathname !== "/student/dashboard") {
      navigate("/student/dashboard");
    }
  }

  function CourseCard({ course }) {
    const isEnrolled = enrollments.some(
      (item) => item.id === course.id
    );

    const isSaved = wishlist.includes(course.id);

    return (
      <article className="edc-course-card">
        <div className={`edc-course-cover edc-cover-${course.color}`}>
          <span className="edc-course-emoji">{course.icon}</span>
          <span className="edc-cover-label">DEMO COURSE</span>
        </div>

        <div className="edc-course-body">
          <span className="edc-category">{course.category}</span>
          <h3>{course.title}</h3>
          <p>By {course.instructor}</p>

          <div className="edc-course-meta">
            <span>
              <BookOpen size={14} /> {course.lessons} lessons
            </span>
            <span>
              <Star size={14} /> Beginner friendly
            </span>
          </div>

          <div className="edc-course-actions">
            <button
              className="edc-btn edc-btn-primary"
              onClick={() => enrollCourse(course.id)}
            >
              {isEnrolled ? "Go to Learning" : "Demo Enroll"}
              <ArrowRight size={16} />
            </button>

            <button
              className={`edc-icon-btn ${isSaved ? "edc-saved" : ""}`}
              onClick={() => toggleWishlist(course.id)}
              title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
              aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  function LearningCard({ course }) {
    return (
      <article className="edc-learning-card">
        <div className={`edc-learning-icon edc-cover-${course.color}`}>
          {course.icon}
        </div>

        <div className="edc-learning-details">
          <div className="edc-learning-top">
            <div>
              <span className="edc-category">{course.category}</span>
              <h3>{course.title}</h3>
              <p>{course.instructor}</p>
            </div>
            <span className="edc-percentage">{course.progress}%</span>
          </div>

          <ProgressBar value={course.progress} />

          <div className="edc-learning-footer">
            <span>
              {course.completedLessons} of {course.lessons} lessons completed
            </span>
            {course.progress === 100 && (
              <span className="edc-completed">
                <CheckCircle2 size={14} /> Completed
              </span>
            )}
          </div>

          <div className="edc-learning-actions">
            <button
              className="edc-btn edc-btn-primary"
              onClick={() => openCoursePlayer(course.id)}
            >
              <Play size={15} />
              {course.progress === 100
                ? "Review Lessons"
                : "Open Learning Player"}
            </button>

            <button
              className="edc-btn edc-btn-light"
              disabled={course.completedLessons === 0}
              onClick={() => updateLesson(course.id, -1)}
            >
              <RotateCcw size={15} /> Undo
            </button>

            <button
              className="edc-icon-btn edc-danger"
              onClick={() => removeEnrollment(course.id)}
              title="Remove enrollment"
              aria-label="Remove enrollment"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  function Overview() {
    return (
      <div className="edc-tab-content">
        <section className="edc-hero">
          <div className="edc-hero-copy">
            <span className="edc-hero-pill">
              <Sparkles size={14} /> YOUR LEARNING JOURNEY
            </span>
            <h2>Keep learning. Keep growing.</h2>
            <p>
              Track your progress, build new skills and make every
              learning session count.
            </p>
            <button
              className="edc-btn edc-btn-white"
              onClick={() => navigateTo("learning")}
            >
              Continue Learning <ArrowRight size={17} />
            </button>
          </div>
          <div className="edc-hero-art">
            <GraduationCap size={104} strokeWidth={1.1} />
          </div>
        </section>

        <section className="edc-stats">
          {[
            {
              label: "Enrolled Courses",
              value: enrolledCourses.length,
              icon: BookOpen,
              color: "purple",
            },
            {
              label: "Completed Courses",
              value: completedCourses.length,
              icon: CheckCircle2,
              color: "green",
            },
            {
              label: "Average Progress",
              value: `${averageProgress}%`,
              icon: TrendingUp,
              color: "blue",
            },
            {
              label: "Wishlist",
              value: wishlist.length,
              icon: Heart,
              color: "pink",
            },
          ].map((stat) => (
            <button
              type="button"
              className="edc-stat-card edc-academic-stat-card"
              key={stat.label}
              onClick={() => navigate(`/student/dashboard/overview/${{
                "Enrolled Courses": "enrolled-courses",
                "Completed Courses": "completed-courses",
                "Average Progress": "average-progress",
                Wishlist: "wishlist",
              }[stat.label]}`)}
            >
              <div className={`edc-stat-icon edc-stat-${stat.color}`}>
                <stat.icon size={21} />
              </div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </button>
          ))}
        </section>

        <section className="edc-two-column">
          <div className="edc-panel">
            <SectionHeading
              eyebrow="YOUR PROGRESS"
              title="Continue Learning"
              action={
                <button
                  className="edc-text-btn"
                  onClick={() => navigateTo("learning")}
                >
                  View All <ChevronRight size={15} />
                </button>
              }
            />

            {enrolledCourses.length ? (
              <div className="edc-learning-list">
                {enrolledCourses.slice(0, 2).map((course) => (
                  <LearningCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Your learning starts here"
                description="Enroll in a demo course below to begin."
              />
            )}
          </div>

          <div className="edc-panel">
            <SectionHeading
              eyebrow="STAY CONSISTENT"
              title="Daily Goals"
              action={
                <button
                  className="edc-text-btn"
                  onClick={() => navigateTo("planner")}
                >
                  Planner <ChevronRight size={15} />
                </button>
              }
            />

            <div className="edc-goal-progress">
              <strong>{goalProgress}%</strong>
              <span>Goals completed</span>
              <ProgressBar value={goalProgress} />
            </div>

            <div className="edc-goals">
              {dailyGoals.slice(0, 4).map((goal) => (
                <label className="edc-goal" key={goal.id}>
                  <input
                    type="checkbox"
                    checked={goal.done}
                    onChange={() => toggleGoal(goal.id)}
                  />
                  <span className={goal.done ? "edc-goal-done" : ""}>
                    {goal.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="edc-panel">
          <SectionHeading
            eyebrow="EXPLORE"
            title="Recommended Demo Courses"
            description="Try the sample learning experience."
          />

          <div className="edc-course-grid">
            {COURSES.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        <section className="edc-feature-banner">
          <div className="edc-feature-icon">
            <Bot size={28} />
          </div>
          <div>
            <h3>Your Personal AI Tutor</h3>
            <p>
              Adaptive explanations, practice and personalized learning
              will be added during the AI integration phase.
            </p>
          </div>
          <button
            className="edc-btn edc-btn-light"
            onClick={() => navigateTo("ai")}
          >
            Explore Feature <ArrowRight size={16} />
          </button>
        </section>
      </div>
    );
  }

  const Learning = () => {
    return (
      <div className="edc-tab-content">
        <SectionHeading
          eyebrow="MY COURSES"
          title="My Learning"
          description="Manage your demo courses and track lesson completion."
        />

        {enrolledCourses.length ? (
          <div className="edc-learning-list">
            {enrolledCourses.map((course) => (
              <LearningCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No enrolled courses yet"
            description="Choose a demo course to start learning."
          />
        )}

        <div className="edc-panel">
          <SectionHeading
            eyebrow="DISCOVER"
            title="Explore Demo Courses"
          />

          <div className="edc-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search demo courses..."
            />
          </div>

          <div className="edc-course-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <EmptyState
              icon={Search}
              title="No matching courses"
              description="Try another search term."
            />
          )}
        </div>
      </div>
    );
  }

  function LearningPlayer() {
    const course = enrolledCourses.find((item) => item.id === playerCourseId);
    if (!course) {
      return (
        <div className="edc-tab-content edc-panel">
          <EmptyState icon={BookOpen} title="Course not found" description="Select an enrolled course from My Learning." />
          <button type="button" className="edc-btn edc-btn-primary" onClick={() => navigateTo("learning")}>Back to My Learning</button>
        </div>
      );
    }
    const index = Math.min(course.lessons - 1, Math.max(0, playerLessonIndex));
    const isCompleted = index < course.completedLessons;
    const isNext = index === course.completedLessons;
    return (
      <div className="edc-tab-content edc-player-page">
        <button type="button" className="edc-text-btn" onClick={() => navigateTo("learning")}>
          <ChevronLeft size={17} /> Back to My Learning
        </button>
        <SectionHeading eyebrow="COURSE LEARNING PLAYER" title={course.title}
          description={`By ${course.instructor} · ${course.lessons} sample lessons`} />
        <div className="edc-player-layout">
          <section className="edc-panel edc-player-main">
            <div className="edc-player-screen edc-player-screen-premium">
              <span className="edc-player-screen-tag"><BookOpen size={14} /> EDUCONNECT AI CLASSROOM</span>
              <div className="edc-player-play-symbol"><Play size={34} fill="currentColor" /></div>
              <div className="edc-player-screen-caption">
                <span>LESSON {String(index + 1).padStart(2, "0")} / {String(course.lessons).padStart(2, "0")}</span>
                <h3>{course.title}</h3>
                <p>Part {index + 1} · Learning preview</p>
              </div>
              <div className="edc-player-screen-bottom"><span><Video size={14} /> Video coming soon</span><span>Course preview</span></div>
            </div>
            <div className="edc-player-details edc-player-details-premium">
              <div className="edc-player-lesson-heading">
                <div><span className="edc-player-eyebrow">CURRENT LESSON</span><h3>Lesson {index + 1} — {course.title}</h3></div>
                <span className={`edc-player-state ${isCompleted ? "is-done" : ""}`}>{isCompleted ? "Completed" : "In progress"}</span>
              </div>
              <div className="edc-player-inline-note"><Video size={18} /><span>Video content will appear here when the instructor uploads it. You can explore the demo lesson flow meanwhile.</span></div>
              <div className="edc-player-actions">
                <button type="button" className="edc-btn edc-btn-light" disabled={index === 0}
                  onClick={() => setPlayerLessonIndex(index - 1)}>Previous Lesson</button>
                <button type="button" className="edc-btn edc-btn-primary"
                  disabled={!isNext || course.completedLessons >= course.lessons}
                  onClick={completePlayerLesson}>
                  <CheckCircle2 size={17} /> {isCompleted ? "Already Completed" : course.progress === 100 ? "Course Completed" : "Mark Lesson Complete"}
                </button>
                <button type="button" className="edc-btn edc-btn-light" disabled={index >= course.lessons - 1 || index >= course.completedLessons}
                  onClick={() => setPlayerLessonIndex(index + 1)}>Next Lesson</button>
              </div>
            </div>
          </section>
          <aside className="edc-panel edc-player-sidebar">
            <h3>Course Content</h3>
            <p>{course.completedLessons} / {course.lessons} lessons completed · {course.progress}%</p>
            <ProgressBar value={course.progress} />
            <div className="edc-player-lessons">
              {Array.from({ length: course.lessons }, (_, lessonIndex) => {
                const done = lessonIndex < course.completedLessons;
                const locked = lessonIndex > course.completedLessons;
                return (
                  <button type="button" key={lessonIndex}
                    className={`edc-player-lesson ${index === lessonIndex ? "active" : ""}`}
                    disabled={locked}
                    onClick={() => setPlayerLessonIndex(lessonIndex)}>
                    {done ? <CheckCircle2 size={18} /> : locked ? <LockKeyhole size={17} /> : <Play size={17} />}
                    <span>Lesson {lessonIndex + 1}<small>{done ? "Completed" : locked ? "Complete previous lessons first" : "Ready to learn"}</small></span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  function StudentProfile() {
    const shown = editingProfile ? profileDraft : studentProfile;
    return (
      <div className="edc-tab-content edc-student-profile-page">
        <SectionHeading eyebrow="ACCOUNT SETTINGS" title="My Student Profile"
          description="Personalize your learning workspace. Changes are stored in this browser only." />
        <section className="edc-student-profile-cover">
          <div className="edc-student-profile-identity">
            <ProfileAvatar image={shown.avatar} />
            <div>
              <span className="edc-student-profile-overline">EDUCONNECT AI STUDENT</span>
              <h2>{shown.fullName?.trim() || "Your Student Profile"}</h2>
              <p>{email}</p>
            </div>
          </div>
          {!editingProfile && (
            <button type="button" className="edc-btn edc-btn-white" onClick={beginProfileEdit}>
              <Pencil size={16} /> Edit Profile
            </button>
          )}
        </section>
        <div className="edc-student-profile-grid">
          <section className="edc-panel edc-student-profile-card">
            <div className="edc-student-profile-card-heading">
              <div><span className="edc-eyebrow">PERSONAL DETAILS</span><h3>{editingProfile ? "Edit Your Information" : "Profile Information"}</h3></div>
              {!editingProfile && <UserRound size={22} />}
            </div>
            {editingProfile ? (
              <form className="edc-student-profile-form" onSubmit={saveStudentProfile}>
                <div className="edc-student-profile-photo-editor">
                  <ProfileAvatar image={profileDraft.avatar} size="small" />
                  <label className="edc-btn edc-btn-light edc-student-photo-button">
                    <Camera size={16} /> Choose Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadStudentAvatar} />
                  </label>
                  {profileDraft.avatar && <button type="button" className="edc-btn edc-btn-light"
                    onClick={() => setProfileDraft((prev) => ({ ...prev, avatar: "" }))}>Remove Photo</button>}
                </div>
                <p className="edc-student-profile-hint">JPG, PNG or WebP · Maximum 1 MB</p>
                <div className="edc-student-profile-fields">
                  <label>Full Name *<input required maxLength={80} value={profileDraft.fullName}
                    onChange={(e) => setProfileDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name" /></label>
                  <label>Email Address<input type="email" readOnly value={email} title="Email is managed by your login account" /></label>
                  <label>Phone Number<input type="tel" maxLength={25} value={profileDraft.phone}
                    onChange={(e) => setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Optional phone number" /></label>
                  <label>City<input maxLength={80} value={profileDraft.city}
                    onChange={(e) => setProfileDraft((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Your city" /></label>
                </div>
                <label className="edc-student-profile-about-label">About Me<textarea rows={5} maxLength={500}
                  value={profileDraft.about} onChange={(e) => setProfileDraft((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="Tell us about your interests and learning goals..." />
                  <small>{profileDraft.about.length} / 500 characters</small></label>
                <div className="edc-student-profile-actions">
                  <button type="submit" className="edc-btn edc-btn-primary"><Save size={16} /> Save Changes</button>
                  <button type="button" className="edc-btn edc-btn-light" onClick={() => {
                    setProfileDraft({ ...studentProfile }); setEditingProfile(false); setProfileNotice("");
                  }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="edc-student-profile-readonly">
                <div><UserRound size={18} /><span>Full Name</span><strong>{studentProfile.fullName || "Not added yet"}</strong></div>
                <div><Mail size={18} /><span>Email</span><strong>{email}</strong></div>
                <div><Phone size={18} /><span>Phone</span><strong>{studentProfile.phone || "Not added yet"}</strong></div>
                <div><MapPin size={18} /><span>City</span><strong>{studentProfile.city || "Not added yet"}</strong></div>
                <div className="edc-student-profile-about"><span>About Me</span><p>{studentProfile.about || "Add a short introduction about yourself."}</p></div>
              </div>
            )}
            {profileNotice && <p className="edc-student-profile-notice" role="status">{profileNotice}</p>}
          </section>
          <aside className="edc-panel edc-student-profile-summary">
            <span className="edc-eyebrow">YOUR LEARNING SNAPSHOT</span>
            <h3>Learning at a glance</h3>
            <div><BookOpen size={19} /><span>Enrolled Courses</span><strong>{enrolledCourses.length}</strong></div>
            <div><CheckCircle2 size={19} /><span>Completed Courses</span><strong>{completedCourses.length}</strong></div>
            <div><TrendingUp size={19} /><span>Average Progress</span><strong>{averageProgress}%</strong></div>
            <div><Award size={19} /><span>Portfolio Projects</span><strong>{portfolioProjects.length}</strong></div>
            <button type="button" className="edc-btn edc-btn-light" onClick={() => navigateTo("portfolio")}>
              View Portfolio <ArrowRight size={16} />
            </button>
            <p className="edc-student-profile-hint">Profile data is saved locally. It will not sync across devices until backend integration.</p>
          </aside>
        </div>
      </div>
    );
  }

  function Planner() {
    return (
      <div className="edc-tab-content">
        <SectionHeading
          eyebrow="STUDY PLANNER"
          title="Plan Your Learning"
          description="Set learning goals and keep track of your daily tasks."
        />

        <div className="edc-two-column">
          <div className="edc-panel">
            <SectionHeading title="My Daily Goals" />

            <div className="edc-goal-progress">
              <strong>{goalProgress}%</strong>
              <span>Completed</span>
              <ProgressBar value={goalProgress} />
            </div>

            <form className="edc-add-goal" onSubmit={addGoal}>
              <input
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                placeholder="Add a study goal..."
                maxLength={100}
              />
              <button className="edc-btn edc-btn-primary" type="submit">
                <Plus size={17} /> Add
              </button>
            </form>

            <div className="edc-goals">
              {dailyGoals.map((goal) => (
                <div className="edc-goal-row" key={goal.id}>
                  <label className="edc-goal">
                    <input
                      type="checkbox"
                      checked={goal.done}
                      onChange={() => toggleGoal(goal.id)}
                    />
                    <span className={goal.done ? "edc-goal-done" : ""}>
                      {goal.title}
                    </span>
                  </label>

                  <button
                    className="edc-icon-btn edc-danger"
                    aria-label="Delete goal"
                    onClick={() =>
                      setDailyGoals((previous) =>
                        previous.filter((item) => item.id !== goal.id)
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              className="edc-btn edc-btn-light"
              onClick={() =>
                setDailyGoals((previous) =>
                  previous.map((goal) => ({ ...goal, done: false }))
                )
              }
            >
              <RotateCcw size={15} /> Reset Goals
            </button>
          </div>

          <div className="edc-panel">
            <SectionHeading title="Learning Roadmap" />

            <div className="edc-roadmap">
              {[
                ["01", "Choose a course", "Select your learning path."],
                ["02", "Complete lessons", "Learn and track progress."],
                ["03", "Practice your skills", "Assessments coming later."],
                ["04", "Build your portfolio", "Showcase completed work."],
              ].map(([number, title, description]) => (
                <div className="edc-roadmap-item" key={number}>
                  <span className="edc-roadmap-number">{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="edc-notice">
              <CalendarDays size={19} />
              <span>
                Upcoming classes and academic calendar will be connected
                when class scheduling is implemented.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function FeaturePage({
    eyebrow,
    title,
    description,
    icon: Icon,
    features,
    note,
  }) {
    return (
      <div className="edc-tab-content">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div className="edc-feature-intro">
          <div className="edc-feature-large-icon">
            <Icon size={38} />
          </div>
          <span className="edc-status-pill">
            <Clock3 size={14} /> Planned Feature
          </span>
          <h3>{title}</h3>
          <p>{note}</p>
        </div>

        <div className="edc-feature-grid">
          {features.map((feature, index) => (
            <div className="edc-feature-tile" key={feature}>
              <div className="edc-feature-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3>{feature}</h3>
              <p>Interface and functionality planned for a later phase.</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Wishlist() {
    const savedCourses = COURSES.filter((course) =>
      wishlist.includes(course.id)
    );

    return (
      <div className="edc-tab-content">
        <SectionHeading
          eyebrow="SAVED FOR LATER"
          title="My Wishlist"
          description="Your favorite demo courses in one place."
        />

        {savedCourses.length ? (
          <div className="edc-course-grid">
            {savedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save courses from the Overview tab."
          />
        )}
      </div>
    );
  }

  function Portfolio() {
    return (
      <div className="edc-tab-content edc-portfolio-page">
        <SectionHeading eyebrow="YOUR ACHIEVEMENTS" title="Certificates & Portfolio"
          description="Track course completions, showcase your projects and build your student profile." />

        <div className="edc-stats">
          {[
            { label: "Completed Courses", value: completedCourses.length, icon: Award, color: "purple" },
            { label: "Portfolio Projects", value: portfolioProjects.length, icon: BookOpen, color: "blue" },
            { label: "Quizzes Passed (70%+)", value: passedQuizzes.length, icon: CheckCircle2, color: "green" },
            { label: "Skills Listed", value: portfolioSkills.length, icon: Target, color: "pink" },
          ].map(({ label, value, icon: Icon, color }) => (
            <button
              type="button"
              className="edc-stat-card edc-academic-stat-card"
              key={label}
              onClick={() => navigate(`/student/dashboard/portfolio/${{
                "Completed Courses": "completed-courses",
                "Portfolio Projects": "projects",
                "Quizzes Passed (70%+)": "quizzes-passed",
                "Skills Listed": "skills",
              }[label]}`)}
            >
              <div className={`edc-stat-icon edc-stat-${color}`}><Icon size={21} /></div>
              <span>{label}</span><strong>{value}</strong>
            </button>
          ))}
        </div>

        <div className="edc-portfolio-tabs">
          {[["certificates", "Certificates", Award], ["projects", "My Projects", BookOpen],
            ["showcase", "Portfolio Showcase", GraduationCap], ["achievements", "Achievements", Star]
          ].map(([id, label, Icon]) => (
            <button key={id} type="button"
              className={`edc-portfolio-tab ${portfolioTab === id ? "edc-portfolio-tab-active" : ""}`}
              onClick={() => { setPortfolioTab(id); setPortfolioMessage(""); }}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>
        {portfolioMessage && <p className="edc-portfolio-message" role="status">{portfolioMessage}</p>}

        {portfolioTab === "certificates" && (
          <div className="edc-panel">
            <SectionHeading title="My Demo Completion Records"
              description="A course appears after all its sample lessons are marked complete." />
            <div className="edc-portfolio-name-field">
              <label htmlFor="edc-certificate-name">Name for demo certificate</label>
              <input id="edc-certificate-name" value={portfolioName}
                maxLength={80} placeholder="Enter your name"
                onChange={(event) => setPortfolioName(event.target.value)} />
            </div>
            <div className="edc-portfolio-notice">These are demonstration records, not verified or accredited certificates. The print window lets you choose Save as PDF.</div>
            {completedCourses.length ? (
              <div className="edc-portfolio-certificate-grid">
                {completedCourses.map((course) => (
                  <article className="edc-portfolio-certificate" key={course.id}>
                    <div className="edc-portfolio-seal"><Award size={38} /></div>
                    <span className="edc-portfolio-overline">EduConnect AI · Demo Record</span>
                    <h3>{course.title}</h3>
                    <p>All {course.lessons} demo lessons completed</p>
                    <span className="edc-portfolio-verified"><CheckCircle2 size={16} /> Demo Completion</span>
                    <button type="button" className="edc-btn edc-btn-primary" onClick={() => printDemoCertificate(course)}>
                      Preview / Save PDF <ArrowRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : <EmptyState icon={Award} title="No completed courses yet"
              description="Go to My Learning and complete every demo lesson to unlock a completion record." />}
          </div>
        )}

        {portfolioTab === "projects" && (
          <div className="edc-panel">
            <SectionHeading title="My Projects" description="Add projects, update details and showcase your skills." />
            {!projectEditing ? (
              <button type="button" className="edc-btn edc-btn-primary" onClick={() => {
                setProjectForm({ id: null, title: "", description: "", skills: "", url: "" });
                setProjectEditing(true); setPortfolioMessage("");
              }}><Plus size={17} /> Add Project</button>
            ) : (
              <form className="edc-portfolio-form" onSubmit={savePortfolioProject}>
                <h3>{projectForm.id ? "Edit Project" : "Add a New Project"}</h3>
                <label>Project Title <input required maxLength={100} value={projectForm.title}
                  onChange={(event) => setProjectForm((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="e.g. React To-Do App" /></label>
                <label>Description <textarea required rows={4} maxLength={1500} value={projectForm.description}
                  onChange={(event) => setProjectForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="Explain what you built and what you learned..." /></label>
                <label>Skills (comma separated) <input maxLength={250} value={projectForm.skills}
                  onChange={(event) => setProjectForm((previous) => ({ ...previous, skills: event.target.value }))}
                  placeholder="React, JavaScript, CSS" /></label>
                <label>Project Link (optional) <input type="url" value={projectForm.url}
                  onChange={(event) => setProjectForm((previous) => ({ ...previous, url: event.target.value }))}
                  placeholder="https://github.com/..." /></label>
                <div className="edc-portfolio-actions">
                  <button type="submit" className="edc-btn edc-btn-primary"><CheckCircle2 size={16} /> Save Project</button>
                  <button type="button" className="edc-btn edc-btn-light" onClick={() => setProjectEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
            {portfolioProjects.length ? <div className="edc-portfolio-project-grid">
              {portfolioProjects.map((project) => <article className="edc-portfolio-project" key={project.id}>
                <h3>{project.title}</h3><p>{project.description}</p>
                <div className="edc-portfolio-skill-list">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">Open Project Link ↗</a>}
                <div className="edc-portfolio-actions">
                  <button type="button" className="edc-btn edc-btn-light" onClick={() => editPortfolioProject(project)}>Edit</button>
                  <button type="button" className="edc-icon-btn edc-danger" aria-label={`Delete ${project.title}`} onClick={() => deletePortfolioProject(project.id)}><Trash2 size={17} /></button>
                </div>
              </article>)}
            </div> : !projectEditing && <EmptyState icon={BookOpen} title="No projects yet" description="Add your first project to start building a portfolio." />}
          </div>
        )}

        {portfolioTab === "showcase" && (
          <div className="edc-panel">
            <SectionHeading title="Portfolio Showcase" description="A live preview of your student portfolio." />
            <div className="edc-portfolio-showcase">
              <div className="edc-portfolio-showcase-hero"><GraduationCap size={38} />
                <div><h3>{portfolioName.trim() || "Your Name"}</h3><p>Student · EduConnect AI</p></div>
              </div>
              <h3>Skills</h3>
              {portfolioSkills.length ? <div className="edc-portfolio-skill-list">{portfolioSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                : <p className="edc-muted">Add skills to your projects to display them here.</p>}
              <h3>Featured Projects</h3>
              {portfolioProjects.length ? <div className="edc-portfolio-project-grid">
                {portfolioProjects.map((project) => <article className="edc-portfolio-project" key={project.id}>
                  <h4>{project.title}</h4><p>{project.description}</p>
                  {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">View Project ↗</a>}
                </article>)}
              </div> : <p className="edc-muted">Your projects will appear here after you add them.</p>}
              <h3>Completed Demo Courses</h3>
              {completedCourses.length ? completedCourses.map((course) => <p key={course.id}><CheckCircle2 size={16} /> {course.title}</p>)
                : <p className="edc-muted">No demo course completions yet.</p>}
            </div>
          </div>
        )}

        {portfolioTab === "achievements" && (
          <div className="edc-panel">
            <SectionHeading title="Learning Achievements" description="Achievements are calculated from your actual demo progress and quiz scores." />
            <div className="edc-portfolio-achievements">
              <article><BookOpen size={28} /><strong>Course Explorer</strong><span>{enrolledCourses.length ? `${enrolledCourses.length} enrolled` : "Not earned yet"}</span></article>
              <article><Award size={28} /><strong>Course Finisher</strong><span>{completedCourses.length ? `${completedCourses.length} completed` : "Not earned yet"}</span></article>
              <article><Brain size={28} /><strong>Quiz Challenger</strong><span>{attemptedQuizzes.length ? `${attemptedQuizzes.length} attempted` : "Not earned yet"}</span></article>
              <article><Star size={28} /><strong>Quiz Achiever</strong><span>{passedQuizzes.length ? `${passedQuizzes.length} scored 70%+` : "Not earned yet"}</span></article>
              <article><Target size={28} /><strong>Project Builder</strong><span>{portfolioProjects.length ? `${portfolioProjects.length} projects` : "Not earned yet"}</span></article>
            </div>
            <p className="edc-muted">These badges are demo milestones, not verified qualifications.</p>
          </div>
        )}
      </div>
    );
  }

  const currentTab = activeTab === "player"
    ? { label: "Course Player" }
    : MENU.find((item) => item.id === activeTab);

  const researchDetailSection = location.pathname.startsWith("/student/dashboard/research/")
    ? RESEARCH_SECTIONS.find((section) => section.id === location.pathname.split("/").at(-1))
    : null;
  const researchDetailItems = researchDetailSection && Array.isArray(researchRecords[researchDetailSection.id])
    ? researchRecords[researchDetailSection.id]
    : [];

  if (researchDetailSection) {
    return (
      <main className="edc-academic-detail-page edc-research-detail-page" aria-live="polite">
        <button type="button" className="edc-text-btn edc-academic-detail-back" onClick={() => navigateTo("research")}>
          <ArrowRight size={16} className="edc-academic-back-icon" /> Back to Research Workspace
        </button>
        <SectionHeading eyebrow="RESEARCH WORKSPACE" title={researchDetailSection.title}
          description={`Review and manage your saved ${researchDetailSection.title.toLowerCase()} records.`}
          action={<button type="button" className="edc-btn edc-btn-primary" onClick={() => {
            switchResearchTab(researchDetailSection.id);
            navigateTo("research");
          }}><Plus size={16} /> Add Record</button>} />
        {researchDetailItems.length ? (
          <div className="edc-research-list edc-research-detail-list">
            {researchDetailItems.map((item) => (
              <article key={item.id} className="edc-research-item">
                <h4>{item.title}</h4>
                {researchDetailSection.fields.filter((field) => field.key !== "title" && item[field.key]).map((field) => (
                  <div key={field.key} className="edc-research-field">
                    <strong>{field.label}:</strong> {field.key === "url" && /^https?:\/\//i.test(item[field.key])
                      ? <a href={item[field.key]} target="_blank" rel="noopener noreferrer">Open link</a>
                      : <span>{item[field.key]}</span>}
                  </div>
                ))}
                <small>Updated {new Date(item.updatedAt).toLocaleDateString()}</small>
                <div className="edc-research-actions">
                  <button type="button" className="edc-btn edc-btn-light" onClick={() => {
                    switchResearchTab(researchDetailSection.id);
                    editResearchRecord(item);
                    navigateTo("research");
                  }}>Edit</button>
                  <button type="button" className="edc-btn edc-btn-light" onClick={() => deleteResearchRecord(item.id, researchDetailSection.id)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="edc-panel edc-academic-stat-empty">
            <EmptyState icon={Microscope} title={`No ${researchDetailSection.title.toLowerCase()} yet`}
              description="Add your first record from the Research Workspace." />
          </div>
        )}
      </main>
    );
  }

  const overviewDetailSlug = location.pathname.startsWith("/student/dashboard/overview/")
    ? location.pathname.split("/").at(-1)
    : "";
  const savedCourses = COURSES.filter((course) => wishlist.includes(course.id));
  const overviewDetailConfig = {
    "enrolled-courses": {
      title: "Enrolled Courses",
      description: "Your courses and current lesson progress.",
      courses: enrolledCourses,
      emptyMessage: "You are not enrolled in any courses yet. Explore demo courses to get started.",
    },
    "completed-courses": {
      title: "Completed Courses",
      description: "Courses where you have completed every lesson.",
      courses: completedCourses,
      emptyMessage: "No completed courses yet. Finish all lessons in a course to see it here.",
    },
    "average-progress": {
      title: "Average Progress",
      description: `Your average progress across ${enrolledCourses.length} enrolled ${enrolledCourses.length === 1 ? "course" : "courses"} is ${averageProgress}%.`,
      courses: enrolledCourses,
      emptyMessage: "Enroll in a course and complete lessons to track your progress.",
    },
    wishlist: {
      title: "Wishlist",
      description: "Courses you have saved to explore later.",
      courses: savedCourses,
      isWishlist: true,
      emptyMessage: "Your wishlist is empty. Add courses from Overview to save them here.",
    },
  }[overviewDetailSlug];

  const masteryDetailSlug = location.pathname.startsWith("/student/dashboard/mastery/")
    ? location.pathname.split("/").at(-1)
    : "";
  const masteryDetailConfig = {
    "enrolled-courses": {
      title: "Enrolled Courses",
      description: "Your enrolled courses and their current learning progress.",
      courses: enrolledCourses,
      emptyMessage: "You are not enrolled in any courses yet. Explore demo courses to start tracking mastery.",
    },
    "quizzes-attempted": {
      title: "Quizzes Attempted",
      description: "Quizzes you have completed and their recorded results.",
      items: assessedMastery.map(({ quiz, course, result }) => ({
        id: quiz.id,
        title: quiz.title,
        detail: `${course?.title || "Course"} · ${result.correct}/${result.total} correct · ${new Date(result.completedAt).toLocaleString()}`,
        status: `${result.percentage}%`,
        actionLabel: "Practice again",
        action: () => reviewMasteryQuiz(quiz.id),
      })),
      emptyMessage: "You have not attempted any quizzes yet. Open a course quiz to begin.",
    },
    "average-quiz-score": {
      title: "Average Quiz Score",
      description: masteryAverage === null
        ? "Your average will appear after you complete a quiz."
        : `Your average score across ${assessedMastery.length} attempted ${assessedMastery.length === 1 ? "quiz" : "quizzes"} is ${masteryAverage}%.`,
      items: assessedMastery.map(({ quiz, course, result }) => ({
        id: quiz.id,
        title: quiz.title,
        detail: `${course?.title || "Course"} · ${result.correct}/${result.total} correct`,
        status: `${result.percentage}%`,
        actionLabel: "Review quiz",
        action: () => reviewMasteryQuiz(quiz.id),
      })),
      emptyMessage: "No quiz scores yet. Complete a quiz to see your score breakdown.",
    },
    "topics-to-revise": {
      title: "Topics to Revise",
      description: "Topics linked to incorrect answers in your latest detailed quiz attempts.",
      items: topicsToRevise.map((topic) => ({
        id: `${topic.quizId}-${topic.title}`,
        title: `Revise ${topic.title}`,
        detail: `${topic.course} · ${topic.question}`,
        status: "Needs revision",
        actionLabel: "Practice topic",
        action: () => reviewMasteryQuiz(topic.quizId),
      })),
      emptyMessage: assessedMastery.length
        ? "No topics need revision based on your latest recorded quiz answers."
        : "Complete a quiz to identify topics that may need revision.",
    },
  }[masteryDetailSlug];

  const portfolioDetailSlug = location.pathname.startsWith("/student/dashboard/portfolio/")
    ? location.pathname.split("/").at(-1)
    : "";
  const portfolioDetailConfig = {
    "completed-courses": {
      title: "Completed Courses",
      description: "Your course completion records and demo certificates.",
      items: completedCourses.map((course) => ({
        id: course.id,
        title: course.title,
        detail: `All ${course.lessons} demo lessons completed. This is a demonstration record, not an accredited certificate.`,
        status: "100% complete",
        actionLabel: "Preview certificate",
        action: () => {
          navigateTo("portfolio");
          setPortfolioTab("certificates");
          printDemoCertificate(course);
        },
      })),
      emptyMessage: "No completed courses yet. Finish every lesson in a course to unlock a demo completion record.",
    },
    projects: {
      title: "Portfolio Projects",
      description: "Projects you have added to your learning portfolio.",
      items: portfolioProjects.map((project) => ({
        id: project.id,
        title: project.title,
        detail: `${project.description}${project.url ? ` · ${project.url}` : ""}`,
        status: `${project.skills.length} ${project.skills.length === 1 ? "skill" : "skills"}`,
        actionLabel: "Edit project",
        action: () => {
          editPortfolioProject(project);
          setPortfolioTab("projects");
          navigateTo("portfolio");
        },
      })),
      emptyMessage: "No portfolio projects yet. Add a project from the My Projects tab.",
    },
    "quizzes-passed": {
      title: "Quizzes Passed",
      description: "Quizzes with a score of 70% or higher.",
      items: passedQuizzes.map((quiz) => {
        const result = quizResults[quiz.id];
        const course = COURSES.find((item) => item.id === quiz.courseId);
        return {
          id: quiz.id,
          title: quiz.title,
          detail: `${course?.title || "Course"} · ${result.correct}/${result.total} correct · ${new Date(result.completedAt).toLocaleString()}`,
          status: `${result.percentage}%`,
          actionLabel: "Practice again",
          action: () => reviewMasteryQuiz(quiz.id),
        };
      }),
      emptyMessage: "No quizzes passed yet. Complete a course quiz and score at least 70% to earn this milestone.",
    },
    skills: {
      title: "Skills Listed",
      description: "Skills collected from the projects in your portfolio.",
      items: portfolioSkills.map((skill) => ({
        id: skill,
        title: skill,
        detail: `Used in: ${portfolioProjects.filter((project) => project.skills.includes(skill)).map((project) => project.title).join(", ")}`,
        status: "Portfolio skill",
        actionLabel: "View showcase",
        action: () => {
          setPortfolioTab("showcase");
          navigateTo("portfolio");
        },
      })),
      emptyMessage: "No skills listed yet. Add skills to one of your portfolio projects.",
    },
  }[portfolioDetailSlug];

  if (portfolioDetailConfig) {
    return (
      <main className="edc-academic-detail-page" aria-live="polite">
        <button type="button" className="edc-text-btn edc-academic-detail-back" onClick={() => navigateTo("portfolio")}>
          <ArrowRight size={16} className="edc-academic-back-icon" /> Back to Certificates & Portfolio
        </button>
        <SectionHeading eyebrow="YOUR ACHIEVEMENTS" title={portfolioDetailConfig.title} description={portfolioDetailConfig.description} />
        {portfolioDetailConfig.items.length ? (
          <div className="edc-academic-results edc-overview-detail-courses">
            {portfolioDetailConfig.items.map((item) => (
              <article className="edc-academic-result" key={item.id}>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                <div className="edc-academic-stat-detail-actions">
                  <span className="edc-academic-status">{item.status}</span>
                  {item.action && <button type="button" className="edc-btn edc-btn-primary" onClick={item.action}>{item.actionLabel}</button>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="edc-panel edc-academic-stat-empty">{portfolioDetailConfig.emptyMessage}</div>
        )}
      </main>
    );
  }

  if (masteryDetailConfig) {
    return (
      <main className="edc-academic-detail-page" aria-live="polite">
        <button type="button" className="edc-text-btn edc-academic-detail-back" onClick={() => navigateTo("mastery")}>
          <ArrowRight size={16} className="edc-academic-back-icon" /> Back to Topic Mastery
        </button>
        <SectionHeading eyebrow="LEARNING INTELLIGENCE" title={masteryDetailConfig.title} description={masteryDetailConfig.description} />
        {masteryDetailConfig.courses ? (
          masteryDetailConfig.courses.length ? (
            <div className="edc-learning-list edc-overview-detail-courses">
              {masteryDetailConfig.courses.map((course) => <LearningCard key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="edc-panel edc-academic-stat-empty">{masteryDetailConfig.emptyMessage}</div>
          )
        ) : masteryDetailConfig.items.length ? (
          <div className="edc-academic-results edc-overview-detail-courses">
            {masteryDetailConfig.items.map((item) => (
              <article className="edc-academic-result" key={item.id}>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                <div className="edc-academic-stat-detail-actions">
                  <span className="edc-academic-status">{item.status}</span>
                  <button type="button" className="edc-btn edc-btn-primary" onClick={item.action}>{item.actionLabel}</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="edc-panel edc-academic-stat-empty">{masteryDetailConfig.emptyMessage}</div>
        )}
      </main>
    );
  }

  if (overviewDetailConfig) {
    return (
      <main className="edc-academic-detail-page" aria-live="polite">
        <button type="button" className="edc-text-btn edc-academic-detail-back" onClick={() => navigateTo("overview")}>
          <ArrowRight size={16} className="edc-academic-back-icon" /> Back to Overview
        </button>
        <SectionHeading eyebrow="YOUR LEARNING JOURNEY" title={overviewDetailConfig.title} description={overviewDetailConfig.description} />
        {overviewDetailConfig.courses.length ? (
          overviewDetailConfig.isWishlist ? (
            <div className="edc-course-grid edc-overview-detail-courses">
              {overviewDetailConfig.courses.map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="edc-learning-list edc-overview-detail-courses">
              {overviewDetailConfig.courses.map((course) => <LearningCard key={course.id} course={course} />)}
            </div>
          )
        ) : (
          <div className="edc-panel edc-academic-stat-empty">{overviewDetailConfig.emptyMessage}</div>
        )}
      </main>
    );
  }

  const academicDetailSlug = location.pathname.startsWith("/student/dashboard/academic/")
    ? location.pathname.split("/").at(-1)
    : "";
  const academicDetailConfig = {
    assignments: {
      title: "All Assignments",
      description: "Review every assignment available in your enrolled courses.",
      items: availableAssignments.map((task) => ({
        id: task.id,
        title: task.title,
        detail: COURSES.find((course) => course.id === task.courseId)?.title || "Course",
        status: submissions[task.id] ? "Submitted" : "Pending",
        actionLabel: submissions[task.id] ? "View submission" : "Open assignment",
        action: () => {
          setAcademicTab("assignments");
          openAssignment(task);
          navigateTo("assignments");
        },
      })),
    },
    submitted: {
      title: "Submitted Assignments",
      description: "Assignments you have saved, including their submission dates.",
      items: availableAssignments.filter((task) => submissions[task.id]).map((task) => ({
        id: task.id,
        title: task.title,
        detail: `Saved ${new Date(submissions[task.id].submittedAt).toLocaleString()}`,
        status: "Submitted",
        actionLabel: "View submission",
        action: () => {
          setAcademicTab("assignments");
          openAssignment(task);
          navigateTo("assignments");
        },
      })),
    },
    pending: {
      title: "Pending Assignments",
      description: "Assignments you have not submitted yet.",
      items: availableAssignments.filter((task) => !submissions[task.id]).map((task) => ({
        id: task.id,
        title: task.title,
        detail: COURSES.find((course) => course.id === task.courseId)?.title || "Course",
        status: "Pending",
        actionLabel: "Start assignment",
        action: () => {
          setAcademicTab("assignments");
          openAssignment(task);
          navigateTo("assignments");
        },
      })),
    },
    "quiz-scores": {
      title: "Quiz Scores",
      description: "Results from the quizzes you have completed.",
      items: availableQuizzes.filter((quiz) => quizResults[quiz.id]).map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        detail: `${COURSES.find((course) => course.id === quiz.courseId)?.title || "Course"} · ${quizResults[quiz.id].correct}/${quizResults[quiz.id].total} correct · ${new Date(quizResults[quiz.id].completedAt).toLocaleString()}`,
        status: `${quizResults[quiz.id].percentage}%`,
        actionLabel: "View grades",
        action: () => {
          setAcademicTab("grades");
          navigateTo("assignments");
        },
      })),
    },
  }[academicDetailSlug];

  if (academicDetailConfig) {
    return (
      <main className="edc-academic-detail-page" aria-live="polite">
        <button type="button" className="edc-text-btn edc-academic-detail-back" onClick={() => navigateTo("assignments")}>
          <ArrowRight size={16} className="edc-academic-back-icon" /> Back to Assignments & Grades
        </button>
        <SectionHeading eyebrow="ACADEMIC WORKSPACE" title={academicDetailConfig.title} description={academicDetailConfig.description} />
        {academicDetailConfig.items.length ? (
          <div className="edc-academic-results">
            {academicDetailConfig.items.map((item) => (
              <article className="edc-academic-result" key={item.id}>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                <div className="edc-academic-stat-detail-actions">
                  <span className="edc-academic-status">{item.status}</span>
                  <button type="button" className="edc-btn edc-btn-primary" onClick={item.action}>{item.actionLabel}</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="edc-panel edc-academic-stat-empty">
            {academicDetailSlug === "quiz-scores"
              ? "No quiz results yet. Complete a quiz to see your scores here."
              : academicDetailSlug === "submitted"
                ? "You have not submitted any assignments yet."
                : academicDetailSlug === "pending"
                  ? "You have no pending assignments."
                  : "No assignments yet. Enroll in a demo course from My Learning to see assignments here."}
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="edc-student-shell">
      <button
        className="edc-mobile-toggle"
        onClick={() => setMobileMenu(true)}
      >
        <Menu size={19} /> Dashboard Menu
      </button>

      {mobileMenu && (
        <button
          className="edc-mobile-backdrop"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`edc-sidebar ${mobileMenu ? "edc-sidebar-open" : ""}`}>
        <div className="edc-sidebar-heading">
          <span>STUDENT WORKSPACE</span>
          <button
            className="edc-sidebar-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="edc-sidebar-profile">
          <ProfileAvatar image={studentProfile.avatar} size="small" />
          <div>
            <strong>{profileDisplayName}</strong>
            <span>Student Account</span>
          </div>
        </div>

        <nav className="edc-navigation" aria-label="Student dashboard">
          {MENU.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`edc-nav-item ${
                  activeTab === item.id ? "edc-nav-active" : ""
                }`}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {activeTab === item.id && <ChevronRight size={15} />}
              </button>
            );
          })}
        </nav>

        <div className="edc-sidebar-bottom">
          <Sparkles size={19} />
          <strong>EduConnect AI</strong>
          <p>Learn. Practice. Grow.</p>
          <span>Frontend Demo</span>
        </div>
      </aside>

      <div className="edc-main">
        <div className="edc-main-header">
          <div>
            <span className="edc-breadcrumb">
              Student Dashboard / {currentTab?.label}
            </span>
            <h2>{currentTab?.label}</h2>
          </div>

          <div className="edc-header-right">
            <span className="edc-demo-badge">
              <span /> Demo Mode
            </span>
            <button type="button" className="edc-student-profile-header-button" title="My Profile"
              aria-label="Open my profile" onClick={() => navigateTo("profile")}>
              <ProfileAvatar image={studentProfile.avatar} size="small" />
            </button>
            <button type="button" className="edc-dashboard-logout" onClick={signOut}>
              <LogOut size={17} /> Log out
            </button>
          </div>
        </div>
{activeTab === "overview" && Overview()}
{activeTab === "learning" && Learning()}
        {activeTab === "player" && LearningPlayer()}
{activeTab === "planner" && Planner()}

        {activeTab === "assignments" && (
          <div className="edc-tab-content edc-academic-page">
            <SectionHeading eyebrow="ACADEMIC WORKSPACE" title="Assignments & Grades"
              description="Submit demo assignments, attempt quizzes and review results." />

            <div className="edc-stats">
              {[
                { label: "Assignments", value: availableAssignments.length, icon: ClipboardList, color: "purple" },
                { label: "Submitted", value: submittedCount, icon: CheckCircle2, color: "green" },
                { label: "Pending", value: availableAssignments.length - submittedCount, icon: Clock3, color: "pink" },
                { label: "Average Quiz Score", value: averageQuizScore === null ? "—" : `${averageQuizScore}%`, icon: Award, color: "blue" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <button
                    type="button"
                    className="edc-stat-card edc-academic-stat-card"
                    key={stat.label}
                    onClick={() => navigate(`/student/dashboard/academic/${{
                      Assignments: "assignments",
                      Submitted: "submitted",
                      Pending: "pending",
                      "Average Quiz Score": "quiz-scores",
                    }[stat.label]}`)}
                  >
                    <div className={`edc-stat-icon edc-stat-${stat.color}`}><Icon size={21} /></div>
                    <span>{stat.label}</span><strong>{stat.value}</strong>
                  </button>
                );
              })}
            </div>

            <div className="edc-academic-tabs">
              {[
                ["assignments", "Assignments", ClipboardList],
                ["quizzes", "Quizzes", BookOpen],
                ["grades", "Grades & Results", Award],
                ["feedback", "Teacher Feedback", Users],
              ].map(([id, label, Icon]) => (
                <button type="button" key={id}
                  className={`edc-academic-tab ${academicTab === id ? "edc-academic-tab-active" : ""}`}
                  onClick={() => { setAcademicTab(id); setSelectedAssignment(null); setSelectedQuiz(null); setAcademicMessage(""); }}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>

            {academicMessage && <div className="edc-academic-message" role="status">{academicMessage}</div>}

            {academicTab === "assignments" && (
              <div className="edc-panel">
                {selectedAssignment ? (
                  <div className="edc-assignment-detail">
                    <button type="button" className="edc-text-btn"
                      onClick={() => { setSelectedAssignment(null); setAcademicMessage(""); }}>
                      ← Back to Assignments
                    </button>
                    {DEMO_ASSIGNMENTS.filter((task) => task.id === selectedAssignment).map((task) => (
                      <div key={task.id}>
                        <span className="edc-category">{COURSES.find((course) => course.id === task.courseId)?.title}</span>
                        <h2>{task.title}</h2><p>{task.description}</p>
                        <p><strong>Maximum Points:</strong> {task.points}</p>
                        <form onSubmit={submitAssignment}>
                          <label htmlFor="edc-assignment-answer">Your Assignment Answer</label>
                          <textarea id="edc-assignment-answer" rows={9} maxLength={10000}
                            value={assignmentAnswer} onChange={(event) => setAssignmentAnswer(event.target.value)}
                            placeholder="Write your assignment here..." />
                          <div className="edc-assignment-form-bottom">
                            <span>{assignmentAnswer.length} / 10000 characters</span>
                            <button type="submit" className="edc-btn edc-btn-primary"><CheckCircle2 size={16} /> Save Demo Submission</button>
                          </div>
                        </form>
                        {submissions[task.id] && <p className="edc-academic-message">
                          Last saved: {new Date(submissions[task.id].submittedAt).toLocaleString()}
                        </p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <SectionHeading eyebrow="COURSEWORK" title="My Assignments"
                      description="Enroll in a demo course to see its practice assignment." />
                    <div className="edc-search"><Search size={18} />
                      <input value={academicSearch} onChange={(event) => setAcademicSearch(event.target.value)}
                        placeholder="Search assignments..." />
                    </div>
                    <div className="edc-academic-grid">
                      {availableAssignments.filter((task) =>
                        `${task.title} ${COURSES.find((course) => course.id === task.courseId)?.title || ""}`
                          .toLowerCase().includes(academicSearch.toLowerCase())
                      ).map((task) => (
                        <article className="edc-academic-card" key={task.id}>
                          <span className="edc-category">{COURSES.find((course) => course.id === task.courseId)?.title}</span>
                          <h3>{task.title}</h3><p>{task.description}</p>
                          <div className="edc-academic-card-bottom">
                            <span>{task.points} points</span>
                            <span className={`edc-academic-status ${submissions[task.id] ? "edc-academic-submitted" : "edc-academic-pending"}`}>
                              {submissions[task.id] ? "Submitted" : "Pending"}
                            </span>
                          </div>
                          <button type="button" className="edc-btn edc-btn-primary" onClick={() => openAssignment(task)}>
                            {submissions[task.id] ? "View Submission" : "Open Assignment"} <ArrowRight size={16} />
                          </button>
                        </article>
                      ))}
                    </div>
                    {availableAssignments.length === 0 && <EmptyState icon={ClipboardList}
                      title="No assignments available" description="Enroll in a demo course from My Learning first." />}
                    {availableAssignments.length > 0 && !availableAssignments.some((task) =>
                      `${task.title} ${COURSES.find((course) => course.id === task.courseId)?.title || ""}`
                        .toLowerCase().includes(academicSearch.toLowerCase())
                    ) && <EmptyState icon={Search} title="No matching assignments" description="Try another search term." />}
                  </>
                )}
              </div>
            )}

            {academicTab === "quizzes" && (
              <div className="edc-panel">
                {selectedQuiz ? (
                  <div className="edc-quiz-area">
                    <button type="button" className="edc-text-btn" onClick={() => { setSelectedQuiz(null); setAcademicMessage(""); }}>
                      ← Back to Quizzes
                    </button>
                    {DEMO_QUIZZES.filter((quiz) => quiz.id === selectedQuiz).map((quiz) => (
                      <form key={quiz.id} onSubmit={submitQuiz}>
                        <h2>{quiz.title}</h2><p>Answer all questions to see your practice score.</p>
                        {quiz.questions.map((question, index) => (
                          <fieldset className="edc-quiz-question" key={index}>
                            <legend>{index + 1}. {question.question}</legend>
                            {question.options.map((option, optionIndex) => (
                              <label className="edc-quiz-option" key={optionIndex}>
                                <input type="radio" name={`academic-question-${index}`}
                                  checked={quizAnswers[index] === optionIndex}
                                  onChange={() => setQuizAnswers((previous) => ({ ...previous, [index]: optionIndex }))} />
                                <span>{option}</span>
                              </label>
                            ))}
                          </fieldset>
                        ))}
                        <button type="submit" className="edc-btn edc-btn-primary"><CheckCircle2 size={16} /> Submit Quiz</button>
                      </form>
                    ))}
                  </div>
                ) : (
                  <>
                    <SectionHeading eyebrow="PRACTICE" title="Practice Quizzes" description="Complete sample multiple-choice quizzes." />
                    <div className="edc-academic-grid">
                      {availableQuizzes.map((quiz) => (
                        <article className="edc-academic-card" key={quiz.id}>
                          <span className="edc-category">{COURSES.find((course) => course.id === quiz.courseId)?.title}</span>
                          <h3>{quiz.title}</h3><p>{quiz.questions.length} questions</p>
                          {quizResults[quiz.id] && <p className="edc-academic-score">Previous score: {quizResults[quiz.id].percentage}%</p>}
                          <button type="button" className="edc-btn edc-btn-primary" onClick={() => startQuiz(quiz.id)}>
                            <Play size={16} /> {quizResults[quiz.id] ? "Retake Quiz" : "Start Quiz"}
                          </button>
                        </article>
                      ))}
                    </div>
                    {availableQuizzes.length === 0 && <EmptyState icon={BookOpen}
                      title="No quizzes available" description="Enroll in a demo course to unlock its quiz." />}
                  </>
                )}
              </div>
            )}

            {academicTab === "grades" && (
              <div className="edc-panel">
                <SectionHeading eyebrow="PERFORMANCE" title="Grades & Results"
                  description="Practice quiz scores are automatic. Assignments await real teacher grading." />
                <div className="edc-academic-results">
                  {availableQuizzes.map((quiz) => (
                    <div className="edc-academic-result" key={quiz.id}>
                      <div><strong>{quiz.title}</strong><p>{COURSES.find((course) => course.id === quiz.courseId)?.title} · Quiz</p></div>
                      <span className="edc-academic-status">{quizResults[quiz.id] ? `${quizResults[quiz.id].percentage}%` : "Not Attempted"}</span>
                    </div>
                  ))}
                  {availableAssignments.map((task) => (
                    <div className="edc-academic-result" key={task.id}>
                      <div><strong>{task.title}</strong><p>{COURSES.find((course) => course.id === task.courseId)?.title} · Assignment</p></div>
                      <span className="edc-academic-status">{submissions[task.id] ? "Submitted · Not Graded" : "Pending"}</span>
                    </div>
                  ))}
                  {availableAssignments.length === 0 && availableQuizzes.length === 0 &&
                    <EmptyState icon={Award} title="No results yet" description="Enroll in a demo course first." />}
                </div>
              </div>
            )}

            {academicTab === "feedback" && (
              <div className="edc-panel">
                <div className="edc-academic-feedback">
                  <div className="edc-feature-large-icon"><Users size={36} /></div>
                  <h2>Teacher Feedback</h2>
                  <p>Teacher comments, assignment grades and suggestions will appear here after backend integration.</p>
                  <span className="edc-status-pill"><Clock3 size={15} /> Backend Integration Pending</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "mastery" && (
          <div className="edc-tab-content edc-mastery-page">
            <SectionHeading
              eyebrow="LEARNING INTELLIGENCE"
              title="Topic Mastery"
              description="Explore your practice quiz performance and find topics to revise. Scores are based on quiz answers, not lesson completion."
            />

            <div className="edc-stats">
              {[
                { label: "Enrolled Courses", value: enrolledCourses.length, icon: BookOpen, color: "purple" },
                { label: "Quizzes Attempted", value: assessedMastery.length, icon: ClipboardList, color: "blue" },
                { label: "Average Quiz Score", value: masteryAverage === null ? "—" : `${masteryAverage}%`, icon: TrendingUp, color: "green" },
                { label: "Topics to Revise", value: topicsToRevise.length, icon: Target, color: "pink" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <button
                    type="button"
                    className="edc-stat-card edc-academic-stat-card"
                    key={stat.label}
                    onClick={() => navigate(`/student/dashboard/mastery/${{
                      "Enrolled Courses": "enrolled-courses",
                      "Quizzes Attempted": "quizzes-attempted",
                      "Average Quiz Score": "average-quiz-score",
                      "Topics to Revise": "topics-to-revise",
                    }[stat.label]}`)}
                  >
                    <div className={`edc-stat-icon edc-stat-${stat.color}`}><Icon size={21} /></div>
                    <span>{stat.label}</span><strong>{stat.value}</strong>
                  </button>
                );
              })}
            </div>

            {masteryRecords.length === 0 ? (
              <div className="edc-panel">
                <EmptyState
                  icon={Brain}
                  title="Enroll to start tracking mastery"
                  description="Enroll in a demo course, then complete its quiz to see evidence-based performance here."
                />
                <button type="button" className="edc-btn edc-btn-primary" onClick={() => navigateTo("learning")}>
                  <BookOpen size={16} /> Explore Courses
                </button>
              </div>
            ) : (
              <>
                <section className="edc-panel">
                  <SectionHeading eyebrow="COURSE PERFORMANCE" title="Quiz-Based Progress"
                    description="Each percentage is your latest quiz score. It is not a verified subject mastery rating." />
                  <div className="edc-mastery-course-grid">
                    {masteryRecords.map(({ quiz, course, result }) => (
                      <article className="edc-mastery-course" key={quiz.id}>
                        <div className="edc-mastery-course-top">
                          <div className={`edc-learning-icon edc-cover-${course?.color || "purple"}`}>
                            {course?.icon || "📘"}
                          </div>
                          <div><strong>{course?.title || quiz.title}</strong><span>{quiz.title}</span></div>
                        </div>
                        <div className="edc-mastery-score-row">
                          <span>Latest practice score</span>
                          <strong>{result ? `${result.percentage}%` : "Not attempted"}</strong>
                        </div>
                        <ProgressBar value={result?.percentage || 0} />
                        <button type="button" className="edc-btn edc-btn-light" onClick={() => reviewMasteryQuiz(quiz.id)}>
                          <Play size={15} /> {result ? "Practice Again" : "Take Quiz"}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="edc-panel">
                  <SectionHeading eyebrow="TOPIC ANALYSIS" title="Your Topic Breakdown"
                    description="Question-level insights are available for quizzes taken after this update. Older quiz scores remain visible above." />
                  <div className="edc-mastery-topics">
                    {masteryRecords.map(({ quiz, course, topics, result }) => (
                      <div className="edc-mastery-topic-group" key={quiz.id}>
                        <h3>{course?.title || quiz.title}</h3>
                        {topics.map((topic) => (
                          <div className="edc-mastery-topic-row" key={topic.title}>
                            <div><strong>{topic.title}</strong><span>{topic.question}</span></div>
                            <span className={`edc-mastery-label edc-mastery-${topic.status}`}>
                              {topic.status === "correct" ? "Correct" : topic.status === "revise" ? "Needs revision" : result ? "Details unavailable" : "Not assessed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="edc-panel">
                  <SectionHeading eyebrow="PERSONAL STUDY PLAN" title="Recommended Revision"
                    description="Suggestions are based on incorrectly answered questions from your latest recorded quiz attempts." />
                  {topicsToRevise.length ? (
                    <div className="edc-mastery-revisions">
                      {topicsToRevise.map((topic) => (
                        <div className="edc-mastery-revision" key={`${topic.quizId}-${topic.title}`}>
                          <div className="edc-mastery-revision-icon"><Target size={19} /></div>
                          <div><strong>Revise {topic.title}</strong><p>{topic.course} · Review: {topic.question}</p></div>
                          <button type="button" className="edc-btn edc-btn-light" onClick={() => reviewMasteryQuiz(topic.quizId)}>
                            Practice <ArrowRight size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="edc-notice"><CheckCircle2 size={19} />
                      <span>{assessedMastery.length === 0
                        ? "Complete a quiz to receive revision suggestions."
                        : "No incorrect answers are recorded in your latest detailed quiz results. If you took quizzes before this update, retake them for topic-level insights."}</span>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === "ai" && (
          <div className="edc-tab-content edc-ai-page">
            <SectionHeading
              eyebrow="PERSONALIZED LEARNING"
              title="Personal AI Tutor"
              description="Explore study tools in demo mode. Real AI answers require backend integration."
            />
            <div className="edc-ai-notice">
              <Bot size={20} />
              <span><strong>Frontend Demo:</strong> The replies below are fixed study templates, not real AI answers. Do not enter passwords or private information.</span>
            </div>
            <div className="edc-ai-layout">
              <aside className="edc-panel edc-ai-tools">
                <h3>Learning Modes</h3>
                <p className="edc-muted">Choose how you want to study.</p>
                <div className="edc-ai-mode-list">
                  {AI_MODES.map((mode) => (
                    <button key={mode} type="button"
                      className={`edc-ai-mode ${aiMode === mode ? "edc-ai-mode-active" : ""}`}
                      onClick={() => setAiMode(mode)}>
                      <Sparkles size={16} /> {mode}
                    </button>
                  ))}
                </div>
                <h3>Try a Topic</h3>
                <div className="edc-ai-prompts">
                  {["React components", "Python functions", "UI/UX wireframes"].map((topic) => (
                    <button type="button" key={topic} onClick={() => setAiInput(topic)}>
                      {topic} <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
                <button type="button" className="edc-btn edc-btn-light edc-ai-clear"
                  onClick={clearAiHistory} disabled={aiHistory.length === 0}>
                  <Trash2 size={16} /> Clear Chat History
                </button>
              </aside>
              <section className="edc-panel edc-ai-chat" aria-label="Tutor chat demo">
                <div className="edc-ai-chat-header">
                  <div className="edc-ai-chat-heading"><span className="edc-ai-bot-icon"><Bot size={20} /></span>
                    <div><strong>EduConnect Study Assistant</strong><small>Demo Mode · {aiMode}</small></div>
                  </div>
                  <span className="edc-status-pill">Template replies</span>
                </div>
                <div className="edc-ai-messages" aria-live="polite">
                  {aiHistory.length === 0 ? (
                    <div className="edc-ai-welcome">
                      <Bot size={40} />
                      <h3>What would you like to study?</h3>
                      <p>Select a learning mode, enter a topic, and get a sample study template.</p>
                    </div>
                  ) : aiHistory.map((message) => (
                    <div key={message.id} className={`edc-ai-message ${message.role === "user" ? "edc-ai-user" : "edc-ai-demo"}`}>
                      <span>{message.role === "user" ? "You" : "Demo Study Guide"}</span>
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>
                <form className="edc-ai-compose" onSubmit={sendAiMessage}>
                  <label htmlFor="edc-ai-input">Your study topic or question</label>
                  <div className="edc-ai-input-row">
                    <input id="edc-ai-input" value={aiInput}
                      onChange={(event) => setAiInput(event.target.value)}
                      placeholder="e.g. Explain React components" maxLength={500} />
                    <button type="submit" className="edc-btn edc-btn-primary" disabled={!aiInput.trim()}>
                      Send <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        )}

        {activeTab === "tutors" && (
          <div className="edc-tab-content edc-tutors-page">
            <SectionHeading eyebrow="PERSONAL LEARNING SUPPORT" title="Hire a Personal Tutor"
              description="Browse fictional tutor profiles and try a sample booking workflow." />
            <div className="edc-tutor-warning"><Users size={20} />
              <span><strong>Frontend Demo:</strong> Profiles, ratings, availability, and bookings are fictional. No teacher is contacted, no payment is taken, and no live class is created.</span>
            </div>
            <div className="edc-tutor-tabs">
              <button type="button" className={tutorTab === "find" ? "edc-tutor-tab active" : "edc-tutor-tab"}
                onClick={() => { setTutorTab("find"); setTutorNotice(""); }}><Search size={17} /> Find Tutors</button>
              <button type="button" className={tutorTab === "sessions" ? "edc-tutor-tab active" : "edc-tutor-tab"}
                onClick={() => { setTutorTab("sessions"); setBookingTutorId(null); }}><CalendarDays size={17} /> My Sessions ({tutorBookings.filter((item) => item.status !== "Cancelled").length})</button>
            </div>
            {tutorNotice && <div className="edc-tutor-notice" role="status">{tutorNotice}</div>}
            {tutorTab === "find" && (
              <>
                <div className="edc-panel edc-tutor-filters">
                  <label><span>Search Tutors</span><div className="edc-search"><Search size={17} />
                    <input value={tutorSearch} onChange={(event) => setTutorSearch(event.target.value)} placeholder="Name, subject or level..." />
                  </div></label>
                  <label><span>Subject</span><select value={tutorSubject} onChange={(event) => setTutorSubject(event.target.value)}>
                    {["All Subjects", ...DEMO_TUTORS.map((tutor) => tutor.subject)].map((subject) => <option key={subject}>{subject}</option>)}
                  </select></label>
                </div>
                <div className="edc-tutor-grid">
                  {matchingTutors.map((tutor) => (
                    <article className="edc-panel edc-tutor-card" key={tutor.id}>
                      <div className="edc-tutor-profile"><div className="edc-tutor-avatar">{tutor.initials}</div>
                        <div><h3>{tutor.name}</h3><p>{tutor.subject}</p><span className="edc-tutor-demo-label">Fictional demo profile</span></div>
                      </div>
                      <p>{tutor.about}</p>
                      <div className="edc-tutor-meta"><span><Star size={15} /> {tutor.rating} sample rating</span><span><GraduationCap size={15} /> {tutor.level}</span><span><Clock3 size={15} /> {tutor.experience}</span></div>
                      <div className="edc-tutor-slots"><strong>Sample time slots</strong><div>{tutor.slots.map((slot) => <span key={slot}>{slot}</span>)}</div></div>
                      <button type="button" className="edc-btn edc-btn-primary" onClick={() => {
                        setBookingTutorId(tutor.id); setBookingSlot(""); setBookingNote(""); setTutorNotice("");
                      }}><CalendarDays size={16} /> Request Demo Session</button>
                    </article>
                  ))}
                </div>
                {matchingTutors.length === 0 && <EmptyState icon={Search} title="No matching demo tutors" description="Try a different name or subject." />}
                {bookingTutor && (
                  <div className="edc-tutor-modal-backdrop" onClick={() => setBookingTutorId(null)}>
                    <section className="edc-tutor-modal" role="dialog" aria-modal="true" aria-label="Request demo session" onClick={(event) => event.stopPropagation()}>
                      <div className="edc-tutor-modal-heading"><div><span className="edc-eyebrow">DEMO BOOKING</span><h3>Session with {bookingTutor.name}</h3></div>
                        <button type="button" className="edc-icon-btn" aria-label="Close" onClick={() => setBookingTutorId(null)}><X size={20} /></button>
                      </div>
                      <p>Choose a sample slot. These are not real calendar dates or confirmed appointments.</p>
                      <form onSubmit={saveTutorBooking} className="edc-tutor-booking-form">
                        <label>Available demo slot<select required value={bookingSlot} onChange={(event) => setBookingSlot(event.target.value)}>
                          <option value="">Select a slot</option>{bookingTutor.slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                        </select></label>
                        <label>What would you like help with? (optional)<textarea rows={4} maxLength={300} value={bookingNote}
                          onChange={(event) => setBookingNote(event.target.value)} placeholder="e.g. React components" /></label>
                        <button type="submit" className="edc-btn edc-btn-primary"><CheckCircle2 size={16} /> Save Demo Request</button>
                      </form>
                    </section>
                  </div>
                )}
              </>
            )}
            {tutorTab === "sessions" && (
              <div className="edc-panel"><SectionHeading eyebrow="YOUR REQUESTS" title="My Demo Sessions"
                description="Requests are stored locally in this browser and are not real appointments." />
                {tutorBookings.length ? <div className="edc-tutor-session-list">{[...tutorBookings].reverse().map((booking) => {
                  const tutor = DEMO_TUTORS.find((item) => item.id === booking.tutorId);
                  return <article key={booking.id} className="edc-tutor-session">
                    <div><strong>{tutor?.name || "Demo Tutor"}</strong><p>{tutor?.subject || "Subject"} · {booking.slot}</p>
                      {booking.note && <p>Study topic: {booking.note}</p>}
                      <small>Requested: {new Date(booking.createdAt).toLocaleString()}</small></div>
                    <div className="edc-tutor-session-actions"><span className="edc-tutor-demo-label">{booking.status}</span>
                      {booking.status !== "Cancelled" && <button type="button" className="edc-btn edc-btn-light"
                        onClick={() => cancelTutorBooking(booking.id)}>Cancel Request</button>}</div>
                  </article>;
                })}</div> : <EmptyState icon={CalendarDays} title="No demo sessions yet" description="Find a tutor and save a sample session request." />}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && StudentProfile()}
        {activeTab === "wishlist" && Wishlist()}
{activeTab === "portfolio" && Portfolio()}
        {activeTab === "research" && (
          <div className="edc-tab-content edc-research-page">
            <SectionHeading eyebrow="ADVANCED LEARNING" title="Research Workspace"
              description="Organize research projects, papers, references, datasets and experiments. Your demo records stay in this browser." />
            <div className="edc-research-overview">
              {RESEARCH_SECTIONS.map((section) => <button key={section.id} type="button"
                className="edc-research-count edc-research-count-button"
                onClick={() => navigate(`/student/dashboard/research/${section.id}`)}>
                <strong>{(researchRecords[section.id] || []).length}</strong><span>{section.title}</span>
              </button>)}
            </div>
            <div className="edc-research-tabs" role="tablist" aria-label="Research workspace sections">
              {RESEARCH_SECTIONS.map((section) => <button key={section.id} type="button" role="tab"
                aria-selected={researchTab === section.id} className={researchTab === section.id ? "active" : ""}
                onClick={() => switchResearchTab(section.id)}>{section.title}</button>)}
            </div>
            <div className="edc-research-layout">
              <section className="edc-panel edc-research-editor">
                <h3>{researchEditId ? "Edit" : "Add"} {currentResearchSection.title === "References & Citations" ? "Reference" : currentResearchSection.title.replace(/s$/, "")}</h3>
                <p className="edc-research-muted">Add your own information. Content is not checked against external sources.</p>
                <form onSubmit={saveResearchRecord} className="edc-research-form">
                  {currentResearchSection.fields.map((field) => <label key={field.key}>
                    <span>{field.label}{field.required ? " *" : ""}</span>
                    {field.options ? <select value={researchForm[field.key] ?? field.options[0]}
                      onChange={(event) => setResearchForm((prev) => ({ ...prev, [field.key]: event.target.value }))}>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select> : field.multiline ? <textarea rows={3} maxLength={3000} value={researchForm[field.key] || ""}
                      onChange={(event) => setResearchForm((prev) => ({ ...prev, [field.key]: event.target.value }))} />
                    : <input type={field.type || "text"} maxLength={500} required={Boolean(field.required)}
                      value={researchForm[field.key] || ""} onChange={(event) => setResearchForm((prev) => ({ ...prev, [field.key]: event.target.value }))} />}
                  </label>)}
                  <div className="edc-research-actions">
                    <button className="edc-btn edc-btn-primary" type="submit"><Plus size={16} /> {researchEditId ? "Update Record" : "Save Record"}</button>
                    {researchEditId && <button type="button" className="edc-btn edc-btn-light" onClick={() => { setResearchEditId(null); setResearchForm({}); setResearchNotice(""); }}>Cancel Edit</button>}
                  </div>
                  {researchNotice && <p role="status" className="edc-research-notice">{researchNotice}</p>}
                </form>
              </section>
              <section className="edc-panel edc-research-library">
                <div className="edc-research-library-head"><h3>{currentResearchSection.title} ({researchItems.length})</h3>
                  <label className="edc-research-search"><Search size={17}/><input aria-label="Search research records" placeholder="Search saved records..."
                    value={researchSearch} onChange={(event) => setResearchSearch(event.target.value)} /></label></div>
                {filteredResearchItems.length ? <div className="edc-research-list">
                  {filteredResearchItems.map((item) => <article key={item.id} className="edc-research-item">
                    <h4>{item.title}</h4>
                    {currentResearchSection.fields.filter((field) => field.key !== "title" && item[field.key]).map((field) => <div key={field.key} className="edc-research-field">
                      <strong>{field.label}:</strong> {field.key === "url" && /^https?:\/\//i.test(item[field.key])
                        ? <a href={item[field.key]} target="_blank" rel="noopener noreferrer">Open link</a> : <span>{item[field.key]}</span>}
                    </div>)}
                    <small>Updated {new Date(item.updatedAt).toLocaleDateString()}</small>
                    <div className="edc-research-actions"><button type="button" className="edc-btn edc-btn-light" onClick={() => editResearchRecord(item)}>Edit</button>
                      <button type="button" className="edc-btn edc-btn-light" onClick={() => deleteResearchRecord(item.id)}><Trash2 size={15}/> Delete</button></div>
                  </article>)}
                </div> : <EmptyState icon={Microscope} title={researchSearch ? "No matching records" : "No records saved yet"}
                  description={researchSearch ? "Try a different search term." : "Use the form to add your first research record."} />}
              </section>
            </div>
            <p className="edc-research-disclaimer">Frontend demo only. Entries are saved in localStorage on this device; they are not synchronized, published, or automatically verified. Back up important research elsewhere.</p>
          </div>
        )}

        <div className="edc-footer-note">
          EduConnect AI · Student Workspace · Frontend Demo
        </div>
      </div>
    </div>
  );
}
