import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  appendAdminActivityRecord,
  notifyAdminDataChanged,
  readAdminArray,
} from "./adminData";

export const ADMIN_OPERATIONS_SETTINGS_KEY =
  "educonnect.adminOperationsSettings";

export const DEMO_TUTORS = [
  {
    id: "tutor-react",
    name: "Areeba Khan",
    subject: "React & JavaScript",
    level: "Beginner",
    experience: "4 years (demo)",
    rating: 4.9,
    about: "Learn frontend fundamentals with practical projects.",
    availability: ["Mon 4:00 PM", "Wed 5:00 PM", "Sat 11:00 AM"],
  },
  {
    id: "tutor-python",
    name: "Hamza Ali",
    subject: "Python Programming",
    level: "Beginner",
    experience: "3 years (demo)",
    rating: 4.8,
    about: "Build confidence with Python exercises and examples.",
    availability: ["Tue 3:00 PM", "Thu 6:00 PM", "Sun 12:00 PM"],
  },
  {
    id: "tutor-design",
    name: "Sara Malik",
    subject: "UI/UX Design",
    level: "Intermediate",
    experience: "5 years (demo)",
    rating: 4.9,
    about: "Explore wireframes, prototyping, and design thinking.",
    availability: ["Mon 6:00 PM", "Fri 4:00 PM", "Sat 2:00 PM"],
  },
];

export const FINANCIAL_DEMO_RECORDS = {
  transactions: [
    { id: "DEMO-TXN-1001", date: "2026-11-01", description: "Course purchase", amount: 2500, status: "Completed" },
    { id: "DEMO-TXN-1002", date: "2026-10-28", description: "Course purchase", amount: 2500, status: "Completed" },
    { id: "DEMO-TXN-1003", date: "2026-10-25", description: "Course purchase", amount: 3000, status: "Completed" },
  ],
  payouts: [
    { id: "DEMO-PAY-201", recipient: "Demo Instructor A", period: "October 2026", amount: 4250, status: "Sample pending" },
    { id: "DEMO-PAY-202", recipient: "Demo Instructor B", period: "October 2026", amount: 3100, status: "Sample paid" },
  ],
  licenses: [
    { id: "DEMO-LIC-301", customer: "Demo Learning Institute", plan: "Institution annual", amount: 120000, renewal: "2027-01-01", status: "Sample active" },
    { id: "DEMO-SUB-302", customer: "Demo Individual", plan: "Learner monthly", amount: 2500, renewal: "2026-12-01", status: "Sample active" },
  ],
  adjustments: [
    { id: "DEMO-ADJ-401", type: "Refund", reference: "DEMO-TXN-1002", amount: 2500, status: "Sample review" },
    { id: "DEMO-ADJ-402", type: "Chargeback", reference: "DEMO-TXN-1003", amount: 3000, status: "Sample closed" },
  ],
  invoices: [
    { id: "DEMO-INV-501", customer: "Demo Learning Institute", issued: "2026-10-01", amount: 120000, status: "Sample issued" },
    { id: "DEMO-INV-502", customer: "Demo Individual", issued: "2026-11-01", amount: 2500, status: "Sample issued" },
  ],
};

export const AI_DEMO_RECORDS = {
  models: [
    { id: "demo-model-1", provider: "Example Provider", model: "EduConnect Demo Assistant", version: "v1.2 (sample)", promptVersion: "prompt-3 (sample)", status: "Configuration example" },
    { id: "demo-model-2", provider: "Local Demo", model: "Knowledge Classifier", version: "v0.8 (sample)", promptVersion: "prompt-2 (sample)", status: "Not deployed" },
  ],
  metrics: [
    { id: "usage", label: "Requests", value: "1,240", note: "Illustrative sample" },
    { id: "latency", label: "Median latency", value: "820 ms", note: "Illustrative sample" },
    { id: "cost", label: "Estimated cost", value: "PKR 1,860", note: "Illustrative sample" },
  ],
  incidents: [
    { id: "DEMO-AI-INC-1", title: "Sample response quality review", severity: "Low (sample)", status: "Open", detail: "Illustrative incident only; no live AI output is connected." },
  ],
  evaluations: [
    { id: "DEMO-EVAL-1", suite: "Educational answer quality", result: "Sample pass", threshold: "80%", score: "86% (sample)" },
    { id: "DEMO-EVAL-2", suite: "Safety review", result: "Sample review", threshold: "No critical findings", score: "Illustrative only" },
  ],
  flags: [
    { id: "tutor-assistant", label: "Tutor assistant demo" },
    { id: "knowledge-search", label: "Knowledge search demo" },
    { id: "new-evaluation", label: "Evaluation preview" },
  ],
};

const DEFAULT_SETTINGS = {
  tutorReviews: {},
  commissionRate: 15,
  aiFlags: {},
  aiIncidentStatuses: {},
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function readAdminOperationsSettings() {
  try {
    const raw = window.localStorage.getItem(ADMIN_OPERATIONS_SETTINGS_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS, error: null };
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {
        ...DEFAULT_SETTINGS,
        error: "Saved Admin operations preferences are not in a supported format.",
      };
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      tutorReviews: isRecord(parsed.tutorReviews) ? parsed.tutorReviews : {},
      aiFlags: isRecord(parsed.aiFlags) ? parsed.aiFlags : {},
      aiIncidentStatuses: isRecord(parsed.aiIncidentStatuses)
        ? parsed.aiIncidentStatuses
        : {},
      error: null,
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      error: "Saved Admin operations preferences could not be read.",
    };
  }
}

function saveSettings(settings, next) {
  if (settings.error) throw new Error(settings.error);
  window.localStorage.setItem(
    ADMIN_OPERATIONS_SETTINGS_KEY,
    JSON.stringify({ ...settings, error: undefined, ...next }),
  );
  notifyAdminDataChanged();
}

export function updateTutorReviewStatus(settings, tutorId, status, actor) {
  saveSettings(settings, {
    tutorReviews: { ...settings.tutorReviews, [tutorId]: status },
  });
  appendAdminActivityRecord({
    actor,
    action: "Updated tutor marketplace review",
    category: "tutor-marketplace",
    entityType: "Tutor Profile",
    entityId: tutorId,
    targetName: tutorId,
    description: `Tutor marketplace review status changed to ${status}.`,
    result: "Success",
  });
}

export function updateCommissionRate(settings, commissionRate, actor) {
  saveSettings(settings, { commissionRate });
  appendAdminActivityRecord({
    actor,
    action: "Updated demo commission configuration",
    category: "financial-management",
    entityType: "Finance Configuration",
    entityId: "commission-rate",
    targetName: "Demo commission rate",
    description: `Demo commission rate set to ${commissionRate}%.`,
    result: "Success",
  });
}

export function updateAiFeatureFlag(settings, flagId, enabled, actor) {
  saveSettings(settings, {
    aiFlags: { ...settings.aiFlags, [flagId]: enabled },
  });
  appendAdminActivityRecord({
    actor,
    action: "Updated AI demo feature flag",
    category: "ai-operations",
    entityType: "AI Feature Flag",
    entityId: flagId,
    targetName: flagId,
    description: `AI demo feature flag ${enabled ? "enabled" : "disabled"}. This is local demo configuration only.`,
    result: "Success",
  });
}

export function updateAiIncidentStatus(settings, incidentId, status, actor) {
  saveSettings(settings, {
    aiIncidentStatuses: {
      ...settings.aiIncidentStatuses,
      [incidentId]: status,
    },
  });
  appendAdminActivityRecord({
    actor,
    action: "Updated AI demo incident review",
    category: "ai-operations",
    entityType: "AI Safety Incident",
    entityId: incidentId,
    targetName: incidentId,
    description: `AI demo incident review status changed to ${status}.`,
    result: "Success",
  });
}

export function getAdminTutorProfiles(settings, users = readAdminArray(ADMIN_USERS_KEY)) {
  const registeredProfiles = users
    .filter((user) =>
      isRecord(user) &&
      (user.role === "Tutor" ||
        user.isTutor === true ||
        isRecord(user.tutorProfile) ||
        isRecord(user.tutorApplication)),
    )
    .map((user) => {
      const profile = isRecord(user.tutorProfile) ? user.tutorProfile : {};
      const application = isRecord(user.tutorApplication) ? user.tutorApplication : {};
      const id = String(user.email || user.id || user.userId);
      return {
        id,
        name: user.name || profile.name || "Unnamed tutor",
        email: user.email || "",
        subject: profile.subject || application.subject || user.subject || "Not provided",
        qualification: application.qualification || profile.qualification || user.qualification || "Not provided",
        experience: profile.experience || application.experience || user.experience || "Not provided",
        availability: profile.availability || user.availability || "Not provided",
        type: "Registered profile",
        status: settings.tutorReviews[id] || application.reviewStatus || "Pending Review",
      };
    });

  const registeredIds = new Set(registeredProfiles.map((profile) => profile.id));
  const demoProfiles = DEMO_TUTORS
    .filter((tutor) => !registeredIds.has(tutor.id))
    .map((tutor) => ({
      ...tutor,
      qualification: "Not provided in fictional demo profile",
      type: "Fictional demo profile",
      status: settings.tutorReviews[tutor.id] || "Pending Review",
    }));

  return [...registeredProfiles, ...demoProfiles];
}

export function getAdminTutorBookings() {
  const records = [];
  const errors = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index) || "";
      if (!key.startsWith("educonnect.student.") || !key.endsWith(".tutorBookings")) {
        continue;
      }
      const studentEmail = key.slice(
        "educonnect.student.".length,
        -".tutorBookings".length,
      );
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (!Array.isArray(saved)) {
          errors.push(`Tutor booking data for ${studentEmail} is not in the expected format.`);
          continue;
        }
        saved.filter(isRecord).forEach((booking) => {
          const tutor = DEMO_TUTORS.find((item) => item.id === booking.tutorId);
          records.push({
            ...booking,
            studentEmail,
            tutorName: tutor?.name || "Demo Tutor",
            tutorSubject: tutor?.subject || "Not provided",
          });
        });
      } catch {
        errors.push(`Tutor booking data for ${studentEmail} could not be read.`);
      }
    }
  } catch {
    errors.push("Browser storage could not be scanned for demo tutor bookings.");
  }
  return { records, errors };
}

export function updateAdminTutorBookingStatus(booking, status, actor) {
  const key = `educonnect.student.${booking.studentEmail}.tutorBookings`;
  const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
  if (!Array.isArray(saved)) throw new Error("Saved tutor booking data is not in the expected format.");
  let updated = false;
  const next = saved.map((item) => {
    if (String(item.id) !== String(booking.id)) return item;
    updated = true;
    return { ...item, status, adminReviewedAt: new Date().toISOString() };
  });
  if (!updated) throw new Error("The tutor booking could not be found.");
  window.localStorage.setItem(key, JSON.stringify(next));
  notifyAdminDataChanged();
  window.dispatchEvent(new Event("educonnect:student-data-changed"));
  appendAdminActivityRecord({
    actor,
    action: "Updated demo tutor booking",
    category: "tutor-marketplace",
    entityType: "Tutor Booking",
    entityId: String(booking.id),
    targetName: booking.tutorName,
    description: `Demo booking status changed to ${status}.`,
    result: "Success",
  });
}

export function getAdminDemoTransactions() {
  const transactions = [];
  const errors = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index) || "";
      if (!key.startsWith("educonnect.student.") || !key.endsWith(".orders")) {
        continue;
      }
      const studentEmail = key.slice(
        "educonnect.student.".length,
        -".orders".length,
      );
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (!Array.isArray(saved)) {
          errors.push(`Order data for ${studentEmail} is not in the expected format.`);
          continue;
        }
        saved.filter(isRecord).forEach((order) => {
          (Array.isArray(order.items) ? order.items : []).filter(isRecord).forEach((item) => {
            transactions.push({
              id: `${order.id || order.purchasedAt}:${item.id}`,
              date: order.purchasedAt || "",
              description: item.title || "Course purchase",
              amount: Math.max(0, Number(item.price) || 0),
              status: order.status || "Unknown",
              studentEmail: order.studentEmail || studentEmail,
            });
          });
        });
      } catch {
        errors.push(`Order data for ${studentEmail} could not be read.`);
      }
    }
  } catch {
    errors.push("Browser storage could not be scanned for demo transactions.");
  }
  return { transactions, errors };
}

export { ADMIN_DATA_CHANGED_EVENT };
