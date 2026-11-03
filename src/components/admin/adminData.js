export const ADMIN_USERS_KEY = "educonnect.registeredUsers";
export const ADMIN_DATA_CHANGED_EVENT = "educonnect:admin-data-changed";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

export function readAdminArray(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function getAdminCourses(users) {
  const teachers = uniqueUsersByRole(users, "Teacher");
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
  const teachers = uniqueUsersByRole(users, "Teacher");
  const courses = getAdminCourses(users);

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
  };
}

export function notifyAdminDataChanged() {
  window.dispatchEvent(new Event(ADMIN_DATA_CHANGED_EVENT));
}
