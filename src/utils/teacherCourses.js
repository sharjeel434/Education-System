import { isModerationVisible } from "./moderationVisibility";
import { getContentState } from "./contentApi";

export function getPublishedTeacherCourses() {
  return getContentState().courses.filter((course) => isModerationVisible("course", `${String(course.teacherEmail || "").toLowerCase()}::${course.id}`));
}

// Keeps the earlier import compatible.
export const getApprovedTeacherCourses =
  getPublishedTeacherCourses;
