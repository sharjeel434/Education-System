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

// Keeps the earlier import compatible.
export const getApprovedTeacherCourses =
  getPublishedTeacherCourses;
