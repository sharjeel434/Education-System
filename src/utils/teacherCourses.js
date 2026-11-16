import { isModerationVisible } from "./moderationVisibility";
import { getStudentAcademicSubjects, INTERMEDIATE_STREAMS } from "./studentRecommendations";

const TEACHER_PREFIX = "educonnect.teacher.";
const COURSES_SUFFIX = ".courses";

function asList(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => typeof item === "string" ? item.split(/[,;\n]+/) : [item])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function uniqueList(...values) {
  return [...new Set(values.flatMap(asList))];
}

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
        const teachingFocus = {
          educationLevel: teacherProfile.teachingEducationLevel || "",
          classNumber: teacherProfile.teachingClassNumber || "",
          intermediateYear: teacherProfile.teachingIntermediateYear || "",
          stream: teacherProfile.teachingStream || "",
          degreeLevel: teacherProfile.teachingDegreeLevel || "",
          program: teacherProfile.teachingProgram || "",
        };
        const focusProgram = teachingFocus.program || (teachingFocus.educationLevel === "intermediate"
          ? INTERMEDIATE_STREAMS.find(([key]) => key === teachingFocus.stream)?.[1] || ""
          : "");
        const teachingSubjects = uniqueList(
          getStudentAcademicSubjects(teachingFocus),
          teacherProfile.expertise,
          teacherProfile.subjects,
          teacherProfile.specializations,
        );

        savedCourses.forEach((course) => {
          if (course.status !== "Published" || !isModerationVisible("course", `${teacherEmail.toLowerCase()}::${String(course.id)}`)) {
            return;
          }

          publishedCourses.push({
            ...course,
            educationLevel: course.educationLevel || teachingFocus.educationLevel,
            targetLevel: course.targetLevel || teachingFocus.educationLevel,
            classNumber: course.classNumber || teachingFocus.classNumber,
            grade: course.grade || teachingFocus.classNumber,
            intermediateYear: course.intermediateYear || teachingFocus.intermediateYear,
            year: course.year || teachingFocus.intermediateYear,
            stream: course.stream || teachingFocus.stream,
            degreeLevel: course.degreeLevel || teachingFocus.degreeLevel,
            program: course.program || focusProgram,
            programs: uniqueList(course.programs, focusProgram),
            subject: course.subject || teachingSubjects,
            subjects: uniqueList(course.subjects, course.subject, course.specialization, teachingSubjects),
            specialization: course.specialization || teachingSubjects,
            teacherEmail,
            instructorName:
              teacherProfile.name ||
              teacherEmail.split("@")[0],
            instructorProfile: { ...teacherProfile, teachingSubjects },
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

export function getCourseCatalogForDisplay() {
  const courses = getPublishedTeacherCourses();
  const courseKeys = new Set(courses.map((course) =>
    `${String(course.teacherEmail || course.instructorEmail || course.instructorName || course.instructor || "demo").trim().toLowerCase()}::${String(course.id)}`
  ));

  if (typeof window === "undefined") {
    return courses;
  }

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith("educonnect.student.") || !key.endsWith(".enrollments")) {
        continue;
      }

      try {
        const enrollments = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (!Array.isArray(enrollments)) continue;

        enrollments.forEach((enrollment) => {
          if (!enrollment || enrollment.id === undefined || enrollment.id === null
            || typeof enrollment.title !== "string" || !enrollment.title.trim()) {
            return;
          }

          const teacherEmail = String(enrollment.teacherEmail || enrollment.instructorEmail || "").trim();
          const instructorName = String(enrollment.instructorName || enrollment.instructor || "EduConnect Instructor").trim();
          const courseKey = `${(teacherEmail || instructorName || "demo").toLowerCase()}::${String(enrollment.id)}`;
          if (courseKeys.has(courseKey)
            || !isModerationVisible("course", `${(teacherEmail || "demo").toLowerCase()}::${String(enrollment.id)}`)) {
            return;
          }

          const lessons = Array.isArray(enrollment.lessons)
            ? enrollment.lessons.length
            : Math.max(0, Number(enrollment.lessons) || 0);
          courses.push({
            id: enrollment.id,
            title: enrollment.title.trim(),
            teacherEmail,
            instructorName,
            category: enrollment.category || "General",
            level: enrollment.level || "",
            description: enrollment.description || "",
            price: Math.max(0, Number(enrollment.price) || 0),
            thumbnail: enrollment.thumbnail || enrollment.image || "",
            image: enrollment.image || enrollment.thumbnail || "",
            lessons,
            isEnrollmentSnapshot: true,
          });
          courseKeys.add(courseKey);
        });
      } catch (error) {
        console.error("Error reading student course history.", error);
      }
    }
  } catch (error) {
    console.error("Course history storage error.", error);
  }

  return courses;
}

// Keeps the earlier import compatible.
export const getApprovedTeacherCourses =
  getPublishedTeacherCourses;
