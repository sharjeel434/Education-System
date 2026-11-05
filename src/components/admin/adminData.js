export const ADMIN_USERS_KEY = "educonnect.registeredUsers";
export const ADMIN_AI_KNOWLEDGE_KEY = "educonnect.aiKnowledge";
export const ADMIN_ACTIVITY_LOG_KEY = "educonnect.adminActivityLog";
export const ADMIN_SUPPORT_REQUESTS_KEY = "educonnect.supportRequests";
export const ADMIN_DATA_CHANGED_EVENT = "educonnect:admin-data-changed";

export const ADMIN_ACTIVITY_CATEGORY_LABELS = {
  "teacher-applications": "Teacher Applications",
  "course-review": "Course Review",
  "ai-knowledge": "AI Knowledge Governance",
  "data-import": "Data Import",
  "security": "Security & Access",
  "support": "Support & Moderation",
};

const KNOWLEDGE_PROPOSAL_STATUSES = [
  "Pending Review",
  "Approved for Processing",
  "Changes Requested",
  "Rights Evidence Requested",
  "Rejected",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readKnowledgeStore() {
  try {
    const raw = window.localStorage.getItem(ADMIN_AI_KNOWLEDGE_KEY);
    if (raw === null) return { records: [], error: null };
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return {
        records: [],
        error: "Saved AI knowledge proposals are not in a supported format.",
      };
    }
    return { records: value, error: null };
  } catch {
    return {
      records: [],
      error: "Saved AI knowledge proposals could not be read.",
    };
  }
}

function uniqueUsersByRole(users, role) {
  const seenEmails = new Set();

  return users.filter((user) => {
    if (!isRecord(user) || user.role !== role || typeof user.email !== "string") {
      return false;
    }

    const email = user.email.trim().toLowerCase();
    if (!email || seenEmails.has(email)) {
      return false;
    }

    seenEmails.add(email);
    return true;
  });
}

export function getAdminTeachers(users = readAdminArray(ADMIN_USERS_KEY)) {
  return uniqueUsersByRole(users, "Teacher");
}

export function readAdminArray(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readAdminUsersState() {
  try {
    const raw = window.localStorage.getItem(ADMIN_USERS_KEY);
    if (raw === null) {
      return { users: [], error: null };
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        users: [],
        error: "Saved user data is not in a supported format.",
      };
    }

    return {
      users: parsed.filter(isRecord),
      error: null,
    };
  } catch {
    return {
      users: [],
      error: "Saved user data could not be read.",
    };
  }
}

export function getAdminCourses(users) {
  const teachers = getAdminTeachers(users);
  const seenCourses = new Set();
  const courses = [];

  teachers.forEach((teacher) => {
    const key = `educonnect.teacher.${teacher.email}.courses`;

    readAdminArray(key).forEach((course) => {
      if (!isRecord(course)) {
        return;
      }

      const courseId =
        course.id === undefined || course.id === null || course.id === ""
          ? JSON.stringify(course)
          : String(course.id);
      const recordKey =
        `${teacher.email.trim().toLowerCase()}:${courseId}`;

      if (seenCourses.has(recordKey)) {
        return;
      }

      seenCourses.add(recordKey);
      courses.push({ ...course, teacherEmail: teacher.email });
    });
  });

  return courses;
}

export function getAdminOverviewData() {
  const users = readAdminArray(ADMIN_USERS_KEY);
  const students = uniqueUsersByRole(users, "Student");
  const teachers = getAdminTeachers(users);
  const courses = getAdminCourses(users);
  const knowledgeProposals = getAdminKnowledgeProposals();

  return {
    studentCount: students.length,
    teacherCount: teachers.length,
    courseCount: courses.length,
    pendingTeacherCount: teachers.filter((user) => user.status === "pending").length,
    approvedTeacherCount: teachers.filter((user) => user.status === "approved").length,
    rejectedTeacherCount: teachers.filter((user) => user.status === "rejected").length,
    pendingCourseCount: courses.filter(
      (course) => course.status === "Pending Approval",
    ).length,
    approvedCourseCount: courses.filter((course) => course.status === "Approved").length,
    publishedCourseCount: courses.filter((course) => course.status === "Published").length,
    rejectedCourseCount: courses.filter((course) => course.status === "Rejected").length,
    knowledgeProposalCount: knowledgeProposals.length,
    pendingKnowledgeProposalCount: knowledgeProposals.filter(
      (proposal) => proposal.status === "Pending Review",
    ).length,
    approvedKnowledgeProposalCount: knowledgeProposals.filter(
      (proposal) => proposal.status === "Approved for Processing",
    ).length,
    rejectedKnowledgeProposalCount: knowledgeProposals.filter(
      (proposal) => proposal.status === "Rejected",
    ).length,
  };
}

export function getAdminKnowledgeStorageState() {
  const { records, error } = readKnowledgeStore();
  return {
    proposals: records.filter(isRecord),
    error,
  };
}

export function getAdminKnowledgeProposals() {
  return getAdminKnowledgeStorageState().proposals;
}

function knowledgeProposalId() {
  return (
    window.crypto?.randomUUID?.() ??
    `knowledge-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function copyCourseContent(course) {
  const snapshot = {};
  const scalarFields = [
    "title",
    "subtitle",
    "description",
    "category",
    "subject",
    "level",
    "language",
    "createdAt",
  ];

  scalarFields.forEach((field) => {
    const value = course[field];
    if (typeof value === "string" || typeof value === "number") {
      snapshot[field] = value;
    }
  });

  if (Array.isArray(course.lessons)) {
    snapshot.lessons = course.lessons
      .filter(isRecord)
      .map((lesson) => {
        const content = {};
        ["id", "title", "description", "duration"].forEach((field) => {
          const value = lesson[field];
          if (typeof value === "string" || typeof value === "number") {
            content[field] = value;
          }
        });
        if (typeof lesson.isFreePreview === "boolean") {
          content.isFreePreview = lesson.isFreePreview;
        }
        return content;
      });
  }

  return snapshot;
}

export function createAdminKnowledgeProposal(course, teacherName) {
  if (!isRecord(course) || typeof course.teacherEmail !== "string") {
    throw new Error("Select an existing course with a registered teacher.");
  }

  const topic = typeof course.title === "string" ? course.title.trim() : "";
  if (!topic) {
    throw new Error("This course has no title and cannot be submitted.");
  }

  const { records, error } = readKnowledgeStore();
  if (error) throw new Error(error);

  const teacherEmail = course.teacherEmail.trim().toLowerCase();
  const courseId = course.id === undefined || course.id === null
    ? ""
    : String(course.id);

  if (!courseId) {
    throw new Error("This course has no ID and cannot be linked to a proposal.");
  }

  if (
    records.some(
      (proposal) =>
        isRecord(proposal) &&
        String(proposal.courseId) === courseId &&
        typeof proposal.teacherEmail === "string" &&
        proposal.teacherEmail.trim().toLowerCase() === teacherEmail,
    )
  ) {
    throw new Error("A knowledge proposal already exists for this course.");
  }

  const proposal = {
    proposalId: knowledgeProposalId(),
    courseId,
    teacherEmail,
    proposedTopic: topic,
    status: "Pending Review",
    submittedAt: new Date().toISOString(),
    courseSnapshot: copyCourseContent(course),
  };

  if (typeof teacherName === "string" && teacherName.trim()) {
    proposal.teacherName = teacherName.trim();
  }
  if (typeof course.category === "string" && course.category.trim()) {
    proposal.subject = course.category.trim();
  } else if (typeof course.subject === "string" && course.subject.trim()) {
    proposal.subject = course.subject.trim();
  }
  if (typeof course.level === "string" && course.level.trim()) {
    proposal.academicLevel = course.level.trim();
  }
  if (typeof course.language === "string" && course.language.trim()) {
    proposal.language = course.language.trim();
  }

  window.localStorage.setItem(
    ADMIN_AI_KNOWLEDGE_KEY,
    JSON.stringify([...records, proposal]),
  );
  notifyAdminDataChanged();
  return proposal;
}

export function updateAdminKnowledgeProposal(proposalId, status, reviewNotes = "") {
  if (!KNOWLEDGE_PROPOSAL_STATUSES.includes(status)) {
    throw new Error("This knowledge proposal status is not supported.");
  }

  const normalizedNotes = typeof reviewNotes === "string" ? reviewNotes.trim() : "";
  if (
    ["Changes Requested", "Rights Evidence Requested", "Rejected"].includes(status) &&
    normalizedNotes.length < 10
  ) {
    throw new Error("Add a meaningful review note of at least 10 characters.");
  }

  const { records, error } = readKnowledgeStore();
  if (error) throw new Error(error);

  let updated = false;
  const updatedRecords = records.map((proposal) => {
    if (
      !updated &&
      isRecord(proposal) &&
      String(proposal.proposalId) === String(proposalId)
    ) {
      if (proposal.status !== "Pending Review") {
        throw new Error("Only proposals pending review can be actioned.");
      }

      updated = true;
      return {
        ...proposal,
        status,
        reviewNotes: normalizedNotes,
        ...(status === "Rights Evidence Requested"
          ? { rightsEvidenceStatus: "Evidence Requested" }
          : {}),
        decisionAt: new Date().toISOString(),
      };
    }
    return proposal;
  });

  if (!updated) {
    throw new Error("This knowledge proposal could not be found. Refresh and try again.");
  }

  window.localStorage.setItem(
    ADMIN_AI_KNOWLEDGE_KEY,
    JSON.stringify(updatedRecords),
  );
  notifyAdminDataChanged();
  return updatedRecords;
}

export function updateAdminTeacherStatus(email, status) {
  const users = readAdminArray(ADMIN_USERS_KEY);
  const normalizedEmail = email.trim().toLowerCase();
  let updated = false;

  const updatedUsers = users.map((user) => {
    if (
      isRecord(user) &&
      user.role === "Teacher" &&
      typeof user.email === "string" &&
      user.email.trim().toLowerCase() === normalizedEmail
    ) {
      updated = true;
      return { ...user, status };
    }

    return user;
  });

  if (!updated) {
    throw new Error("This teacher application could not be found. Refresh and try again.");
  }

  window.localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updatedUsers));
  notifyAdminDataChanged();
  return updatedUsers;
}

export function updateAdminCourseStatus(
  teacherEmail,
  courseId,
  status,
  changes = {},
) {
  const allowedStatuses = [
    "Approved",
    "Rejected",
    "Changes Requested",
    "Suspended",
  ];
  if (!allowedStatuses.includes(status)) {
    throw new Error("This course status change is not supported.");
  }

  if (status === "Changes Requested") {
    if (typeof changes.revisionNotes !== "string" || !changes.revisionNotes.trim()) {
      throw new Error("Add revision notes before requesting changes.");
    }
  } else if (status !== "Suspended" && Object.keys(changes).length > 0) {
    throw new Error("Additional course fields are not supported for this action.");
  }

  if (courseId === undefined || courseId === null || courseId === "") {
    throw new Error("This course cannot be updated because it has no course ID.");
  }

  const key = `educonnect.teacher.${teacherEmail}.courses`;
  const courses = readAdminArray(key);
  let updated = false;

  const updatedCourses = courses.map((course) => {
    if (
      !updated &&
      isRecord(course) &&
      String(course.id) === String(courseId)
    ) {
      const isPending = course.status === "Pending Approval";
      const canSuspend = ["Approved", "Published"].includes(course.status);
      if (
        (status === "Suspended" && !canSuspend) ||
        (status !== "Suspended" && !isPending)
      ) {
        throw new Error(
          status === "Suspended"
            ? "Only approved or published courses can be suspended."
            : "Only courses pending approval can be reviewed.",
        );
      }

      updated = true;
      return {
        ...course,
        ...(status === "Changes Requested"
          ? { revisionNotes: changes.revisionNotes.trim() }
          : {}),
        status,
      };
    }

    return course;
  });

  if (!updated) {
    throw new Error("This course could not be found. Refresh and try again.");
  }

  window.localStorage.setItem(key, JSON.stringify(updatedCourses));
  notifyAdminDataChanged();
  return updatedCourses;
}

export function createAdminActivityId(prefix, seed = "") {
  const cleanedPrefix = String(prefix || "activity").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "activity";
  const cleanedSeed = String(seed || "").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const stamp = Math.random().toString(36).slice(2, 10);

  return cleanedSeed ? `${cleanedPrefix}-${cleanedSeed}-${stamp}` : `${cleanedPrefix}-${stamp}`;
}

export function getAdminActivityLog() {
  try {
    const raw = window.localStorage.getItem(ADMIN_ACTIVITY_LOG_KEY);
    if (raw === null) return { records: [], error: null };
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return {
        records: [],
        error: "Saved admin activity log is not in a supported format.",
      };
    }

    return {
      records: parsed.filter(isRecord),
      error: null,
    };
  } catch {
    return {
      records: [],
      error: "Saved admin activity log could not be read.",
    };
  }
}

export function appendAdminActivityRecord(record) {
  if (!isRecord(record)) {
    throw new Error("The activity record is invalid.");
  }

  const previous = getAdminActivityLog();
  if (previous.error) {
    throw new Error(previous.error);
  }

  const nextRecord = {
    ...record,
    id: typeof record.id === "string" && record.id.trim() ? record.id : `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: typeof record.timestamp === "string" && record.timestamp.trim()
      ? record.timestamp
      : new Date().toISOString(),
  };

  const updated = [...previous.records, nextRecord];
  window.localStorage.setItem(ADMIN_ACTIVITY_LOG_KEY, JSON.stringify(updated));
  notifyAdminDataChanged();
  return updated;
}

export function notifyAdminDataChanged() {
  window.dispatchEvent(new Event(ADMIN_DATA_CHANGED_EVENT));
}

export const SUPPORT_REQUEST_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

export const SUPPORT_REQUEST_CATEGORIES = [
  "Technical Issue",
  "Account & Access",
  "Course Content",
  "Billing & Payment",
  "Moderation & Appeal",
  "General Inquiry",
];

export const SUPPORT_REQUEST_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export function readAdminSupportRequestsState() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SUPPORT_REQUESTS_KEY);
    if (raw === null) {
      return { records: [], error: null };
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        records: [],
        error: "Saved support requests data is not in a supported format.",
      };
    }

    return {
      records: parsed.filter(isRecord),
      error: null,
    };
  } catch {
    return {
      records: [],
      error: "Saved support requests could not be read from browser storage.",
    };
  }
}

export function getAdminSupportRequests() {
  return readAdminSupportRequestsState().records;
}

export function createAdminSupportRequest({
  subject,
  description,
  category = "General Inquiry",
  priority = "Medium",
  requesterName = "Demo Student",
  requesterEmail = "student.demo@example.com",
  actor = "Admin",
}) {
  const cleanSubject = typeof subject === "string" ? subject.trim() : "";
  const cleanDescription = typeof description === "string" ? description.trim() : "";

  if (cleanSubject.length < 3) {
    throw new Error("Subject must be at least 3 characters long.");
  }
  if (cleanDescription.length < 5) {
    throw new Error("Description must be at least 5 characters long.");
  }
  if (!SUPPORT_REQUEST_CATEGORIES.includes(category)) {
    throw new Error("Please select a supported support category.");
  }
  if (!SUPPORT_REQUEST_PRIORITIES.includes(priority)) {
    throw new Error("Please select a supported priority level.");
  }

  const state = readAdminSupportRequestsState();
  if (state.error) {
    throw new Error(state.error);
  }

  const id = `support-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newRequest = {
    id,
    subject: cleanSubject,
    description: cleanDescription,
    category,
    priority,
    status: "Open",
    requesterName: typeof requesterName === "string" && requesterName.trim() ? requesterName.trim() : "Demo User",
    requesterEmail: typeof requesterEmail === "string" && requesterEmail.trim() ? requesterEmail.trim().toLowerCase() : "demo.user@example.com",
    createdAt: now,
    updatedAt: now,
    responses: [],
  };

  const updatedRecords = [newRequest, ...state.records];
  window.localStorage.setItem(ADMIN_SUPPORT_REQUESTS_KEY, JSON.stringify(updatedRecords));

  try {
    appendAdminActivityRecord({
      actor: actor || "Admin",
      action: "Created support request",
      category: "support",
      entityType: "Support Request",
      entityId: id,
      targetName: cleanSubject,
      description: `Created demo support request: "${cleanSubject}" [${category} / ${priority}]`,
      result: "Success",
    });
  } catch {
    // Activity log failure should not block request creation
  }

  notifyAdminDataChanged();
  return newRequest;
}

export function updateAdminSupportRequestStatus(id, nextStatus, actor = "Admin") {
  if (!SUPPORT_REQUEST_STATUSES.includes(nextStatus)) {
    throw new Error("This support request status is not supported.");
  }

  const state = readAdminSupportRequestsState();
  if (state.error) {
    throw new Error(state.error);
  }

  let updatedRecord = null;
  const updatedRecords = state.records.map((item) => {
    if (String(item.id) === String(id)) {
      updatedRecord = {
        ...item,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return item;
  });

  if (!updatedRecord) {
    throw new Error("The requested support record could not be found.");
  }

  window.localStorage.setItem(ADMIN_SUPPORT_REQUESTS_KEY, JSON.stringify(updatedRecords));

  try {
    appendAdminActivityRecord({
      actor: actor || "Admin",
      action: nextStatus === "Closed" ? "Closed support request" : "Updated support request status",
      category: "support",
      entityType: "Support Request",
      entityId: String(id),
      targetName: updatedRecord.subject || "Support Request",
      description: `Updated status of request ${id} to "${nextStatus}".`,
      result: "Success",
    });
  } catch {
    // Activity log failure should not block status change
  }

  notifyAdminDataChanged();
  return updatedRecords;
}

export function addAdminSupportResponse(id, { message, type = "response", author = "Admin", actor = "Admin" }) {
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  if (cleanMessage.length < 2) {
    throw new Error("Response or note message cannot be empty.");
  }

  const allowedTypes = ["response", "internal_note"];
  const finalType = allowedTypes.includes(type) ? type : "response";

  const state = readAdminSupportRequestsState();
  if (state.error) {
    throw new Error(state.error);
  }

  const now = new Date().toISOString();
  const responseId = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let updatedRecord = null;

  const newResponse = {
    id: responseId,
    message: cleanMessage,
    type: finalType,
    author: typeof author === "string" && author.trim() ? author.trim() : actor || "Admin",
    createdAt: now,
  };

  const updatedRecords = state.records.map((item) => {
    if (String(item.id) === String(id)) {
      const existingResponses = Array.isArray(item.responses) ? item.responses : [];
      updatedRecord = {
        ...item,
        responses: [...existingResponses, newResponse],
        updatedAt: now,
      };
      return updatedRecord;
    }
    return item;
  });

  if (!updatedRecord) {
    throw new Error("The requested support record could not be found.");
  }

  window.localStorage.setItem(ADMIN_SUPPORT_REQUESTS_KEY, JSON.stringify(updatedRecords));

  try {
    appendAdminActivityRecord({
      actor: actor || "Admin",
      action: finalType === "internal_note" ? "Added internal note" : "Added support response",
      category: "support",
      entityType: "Support Request",
      entityId: String(id),
      targetName: updatedRecord.subject || "Support Request",
      description: `${finalType === "internal_note" ? "Added internal note" : "Added response"} to support request ${id}.`,
      result: "Success",
    });
  } catch {
    // Activity log failure should not block response addition
  }

  notifyAdminDataChanged();
  return updatedRecord;
}
