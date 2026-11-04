
const TEACHER_PREFIX = "educonnect.teacher.";
const COURSES_SUFFIX = ".courses";

export function getPublishedTeacherCourses() {
  const publishedCourses = [];

  if (typeof window === "undefined") {
    return publishedCourses;
  }

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);

      if (
        !key ||
        !key.startsWith(TEACHER_PREFIX) ||
        !key.endsWith(COURSES_SUFFIX)
      ) {
        continue;
      }

      const teacherEmail = key.slice(
        TEACHER_PREFIX.length,
        -COURSES_SUFFIX.length
      );

      try {
        const savedCourses = JSON.parse(
          window.localStorage.getItem(key) || "[]"
        );

        if (!Array.isArray(savedCourses)) {
          continue;
        }

        const profileKey =
          `educonnect.teacher.${teacherEmail}.profile`;

        const teacherProfile = JSON.parse(
          window.localStorage.getItem(profileKey) || "{}"
        );

        savedCourses.forEach((course) => {
          if (course.status !== "Published") {
            return;
          }

          publishedCourses.push({
            ...course,
            teacherEmail,
            instructorName:
              teacherProfile.name ||
              teacherEmail.split("@")[0],
            instructorProfile: teacherProfile,
          });
        });
      } catch (error) {
        console.error(
          "Error reading teacher courses:",
          error
        );
      }
    }
  } catch (error) {
    console.error("Marketplace storage error:", error);
  }

  return publishedCourses;
}

// Keeps the earlier import compatible.
export const getApprovedTeacherCourses =
  getPublishedTeacherCourses;
