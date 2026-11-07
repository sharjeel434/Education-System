import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileDown,
  FileUp,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldCheck,
  Store,
  UsersRound,
  WalletCards,
  LayoutDashboard,
  Monitor,
} from "lucide-react";

export const ADMIN_SECTIONS = [
  {
    id: "dashboard",
    path: "/admin/dashboard",
    title: "Overview Dashboard",
    navTitle: "Dashboard",
    description: "A snapshot of platform activity and work that may need attention.",
    icon: LayoutDashboard,
  },
  {
    id: "teachers",
    path: "/admin/teachers",
    title: "Teacher Applications",
    description: "Manage teacher applications, review qualifications, and approve or reject applications.",
    icon: ClipboardCheck,
  },
  {
    id: "courses",
    path: "/admin/courses",
    title: "Course Review & Approval",
    navTitle: "Course Review",
    description: "Review submitted courses and manage course approval.",
    icon: BookOpenCheck,
  },
  {
    id: "knowledge",
    path: "/admin/knowledge",
    title: "AI Knowledge Governance",
    navTitle: "Knowledge Proposals",
    pageTitle: "AI Knowledge Governance",
    description: "Review proposed educational content before it can become part of shared EduConnect AI knowledge.",
    icon: BrainCircuit,
  },
  {
    id: "users",
    path: "/admin/users",
    title: "Users & Permissions",
    navTitle: "User Management",
    description: "View registered demo users and their current account roles and statuses.",
    icon: UsersRound,
  },
  {
    id: "institutions",
    path: "/admin/institutions",
    title: "Institution Management",
    description: "Manage institution profiles, memberships, and platform access.",
    icon: Building2,
  },
  {
    id: "tutors",
    path: "/admin/tutors",
    title: "Tutor Marketplace",
    description: "Oversee tutor listings and marketplace activity.",
    icon: Store,
  },
  {
    id: "finance",
    path: "/admin/finance",
    title: "Financial Management",
    navTitle: "Financial Management",
    description: "Review platform payment operations and financial records.",
    icon: WalletCards,
  },
  {
    id: "ai-operations",
    path: "/admin/ai-operations",
    title: "AI Operations",
    description: "Monitor and manage the platform's AI services.",
    icon: Activity,
  },
  {
    id: "support",
    path: "/admin/support",
    title: "Support & Appeals",
    description: "Review user support requests and account appeals.",
    icon: LifeBuoy,
  },
  {
    id: "moderation",
    path: "/admin/moderation",
    title: "Moderation & Governance",
    description: "Moderation and appeals currently use the shared Support & Appeals workflow.",
    icon: ShieldCheck,
  },
  {
    id: "reports",
    path: "/admin/reports",
    title: "Reports & Analytics",
    description: "View the summary counts currently available from demo browser data.",
    icon: BarChart3,
  },
  {
    id: "data-export",
    path: "/admin/data-export",
    title: "Data Export",
    description: "Download available browser demo records as CSV files.",
    icon: FileDown,
    parentId: "reports",
  },
  {
    id: "data-import",
    path: "/admin/data-import",
    title: "Data Import",
    description: "Validate and add supported CSV records to this browser’s Admin demo data.",
    icon: FileUp,
    parentId: "settings",
  },
  {
    id: "notifications",
    path: "/admin/notifications",
    title: "Notifications & Alerts",
    description: "Review current teacher, course, and AI knowledge items awaiting Admin review.",
    icon: Bell,
    parentId: "dashboard",
  },
  {
    id: "activity-log",
    path: "/admin/audit-logs",
    title: "Audit Logs",
    description: "Review recent admin actions recorded in this demo browser session.",
    icon: ScrollText,
  },
  {
    id: "settings",
    path: "/admin/settings",
    title: "Admin Settings",
    navTitle: "Settings & Configuration",
    description: "Manage local Admin interface display preferences for this browser.",
    icon: Settings,
  },
  {
    id: "security",
    path: "/admin/security",
    title: "Admin Security",
    navTitle: "Security & Privacy",
    pageTitle: "Admin Security & Access Control",
    description: "Review current browser-level access controls, session state, and security boundaries.",
    icon: ShieldCheck,
  },
  {
    id: "system-health",
    path: "/admin/system-health",
    title: "System Health",
    description: "Frontend environment diagnostics and module availability.",
    icon: Monitor,
    parentId: "reports",
  },
];

// Sections omitted from groups are hidden from the sidebar; parentId drives highlighting.
const getSectionsById = (ids) =>
  ids.map((id) => ADMIN_SECTIONS.find((section) => section.id === id));

export const ADMIN_NAV_GROUPS = [
  {
    id: "dashboard",
    label: "",
    items: getSectionsById(["dashboard"]),
  },
  {
    id: "users-access",
    label: "USERS & ACCESS",
    items: getSectionsById(["users", "teachers", "institutions"]),
  },
  {
    id: "content-governance",
    label: "CONTENT GOVERNANCE",
    items: getSectionsById(["courses", "knowledge", "moderation", "tutors"]),
  },
  {
    id: "finance",
    label: "FINANCE",
    items: getSectionsById(["finance"]),
  },
  {
    id: "ai-security",
    label: "AI & SECURITY",
    items: getSectionsById(["ai-operations", "security"]),
  },
  {
    id: "support-audit",
    label: "SUPPORT & AUDIT",
    items: getSectionsById(["support", "activity-log", "reports"]),
  },
  {
    id: "system",
    label: "SYSTEM",
    items: getSectionsById(["settings"]),
  },
];

export const ADMIN_PATH_REDIRECTS = {
  "/admin/activity-log": "/admin/audit-logs",
};

export const ADMIN_ROUTES = ADMIN_SECTIONS.map((section) => section.path);

export function getAdminSectionByPath(pathname) {
  return ADMIN_SECTIONS.find((section) => section.path === pathname) ?? null;
}
