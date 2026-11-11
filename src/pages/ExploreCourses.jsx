
import PublishedCourses from "../components/Marketplace/PublishedCourses";

import React, { useEffect, useMemo, useState } from "react";
import ResilientImage from "../components/ResilientImage";
import ClassBooksArtwork from "../components/ClassBooksArtwork";
import {
  getProgramGroupsForDegreeLevel,
  getStudentAcademicSubjects,
  INTERMEDIATE_STREAMS,
  ONLINE_COURSES,
  normalizeRecommendationText,
} from "../utils/studentRecommendations";
import "./ExploreCourses.css";

const imageSchool = "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900";
const imageUniversity = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900";
const imageComputer = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900";
const imageScience = "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900";
const imageBusiness = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900";
const imageDesign = "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900";
const schoolClassImages = [
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900",
  imageScience,
  imageComputer,
  imageScience,
  imageUniversity
];
const headerThemes = [
  ["#3b0764", "#7c3aed"],
  ["#123a70", "#3978df"],
  ["#07545c", "#11a3a0"],
  ["#713b16", "#e58a2c"],
  ["#6b214f", "#c64f91"],
  ["#254b37", "#55a875"],
  ["#3c3478", "#8170ed"],
  ["#71352c", "#d66c4e"],
  ["#164c66", "#38a0c2"],
  ["#4c3b19", "#c19a3c"],
  ["#3f356e", "#9670dc"],
  ["#394b67", "#668bb9"]
];
const categoryHeaderThemes = {
  Technology: ["#123a70", "#3978df"],
  Design: ["#6b214f", "#c64f91"],
  Business: ["#713b16", "#e58a2c"],
  Science: ["#07545c", "#11a3a0"],
  "Health Sciences": ["#254b37", "#55a875"],
  Engineering: ["#164c66", "#38a0c2"],
  Humanities: ["#3f356e", "#9670dc"],
  Research: ["#394b67", "#668bb9"],
  College: ["#3c3478", "#8170ed"],
  Undergraduate: ["#123a70", "#3978df"],
  Postgraduate: ["#713b16", "#e58a2c"],
  Doctoral: ["#254b37", "#55a875"]
};

const pakistanBoards = [
  "FBISE Federal Board",
  "BISE Lahore",
  "BISE Rawalpindi",
  "BISE Gujranwala",
  "BISE Faisalabad",
  "BISE Multan",
  "BISE Sargodha",
  "BISE Bahawalpur",
  "BISE DG Khan",
  "BISE Sahiwal",
  "BISE Peshawar",
  "BISE Abbottabad",
  "BISE Swat",
  "BISE Mardan",
  "BISE Kohat",
  "BISE Bannu",
  "BISE DI Khan",
  "BISE Malakand",
  "BISE Karachi",
  "BISE Hyderabad",
  "BISE Sukkur",
  "BISE Larkana",
  "BISE Mirpurkhas",
  "BISE Quetta",
  "AJK BISE Mirpur",
  "Aga Khan University Examination Board"
];

const schoolSubjects = {
  1: ["English", "Urdu", "Mathematics", "General Knowledge"],
  2: ["English", "Urdu", "Mathematics", "General Knowledge"],
  3: ["English", "Urdu", "Mathematics", "General Science", "Social Studies"],
  4: ["English", "Urdu", "Mathematics", "General Science", "Social Studies"],
  5: ["English", "Urdu", "Mathematics", "General Science", "Social Studies"],
  6: ["English", "Urdu", "Mathematics", "Science", "Computer", "Social Studies"],
  7: ["English", "Urdu", "Mathematics", "Science", "Computer", "Social Studies"],
  8: ["English", "Urdu", "Mathematics", "Science", "Computer", "Social Studies"],
  9: ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Computer"],
  10: ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Computer"],
  11: ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Computer"],
  12: ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Computer"]
};

const chapterLibrary = {
  English: ["Grammar and Sentence Structure", "Vocabulary Building", "Reading Comprehension", "Writing Skills"],
  Urdu: ["Reading and Comprehension", "Grammar", "Vocabulary", "Essay Writing"],
  Mathematics: ["Number Systems", "Algebra", "Geometry", "Statistics and Probability"],
  "General Knowledge": ["Our World", "People and Places", "Environment", "Everyday Science"],
  "General Science": ["Living Things", "Plants and Animals", "Matter", "Environment"],
  "Social Studies": ["History", "Geography", "Civics", "Culture and Society"],
  Science: ["Scientific Method", "Matter and Energy", "Living Organisms", "Environment"],
  Computer: ["Computer Fundamentals", "Hardware and Software", "Programming Basics", "Internet and Networks"],
  Physics: ["Measurements", "Motion and Force", "Work and Energy", "Waves and Electricity"],
  Chemistry: ["Atomic Structure", "Chemical Bonding", "Chemical Reactions", "Organic Chemistry"],
  Biology: ["Cell Biology", "Genetics", "Human Physiology", "Ecology"]
};

const professionalCourses = [
  { title: "Web Development", category: "Technology", level: "Professional", subjects: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Databases"], image: imageComputer },
  { title: "Artificial Intelligence", category: "Technology", level: "Professional", subjects: ["AI Fundamentals", "Machine Learning", "Deep Learning", "Neural Networks", "Generative AI"], image: imageComputer },
  { title: "Machine Learning", category: "Technology", level: "Professional", subjects: ["Python", "Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Neural Networks"], image: imageComputer },
  { title: "Data Science", category: "Technology", level: "Professional", subjects: ["Python", "Statistics", "Data Analysis", "Data Visualization", "Big Data"], image: imageComputer },
  { title: "Cyber Security", category: "Technology", level: "Professional", subjects: ["Security Fundamentals", "Network Security", "Cryptography", "Ethical Security Concepts"], image: imageComputer },
  { title: "Cloud Computing", category: "Technology", level: "Professional", subjects: ["Cloud Fundamentals", "Cloud Architecture", "Virtualization", "Cloud Security"], image: imageComputer },
  { title: "Mobile App Development", category: "Technology", level: "Professional", subjects: ["Android Development", "iOS Development", "React Native", "App Design"], image: imageComputer },
  { title: "Software Engineering", category: "Technology", level: "Professional", subjects: ["Software Design", "Programming", "Testing", "Software Architecture", "Project Management"], image: imageComputer },
  { title: "Networking", category: "Technology", level: "Professional", subjects: ["Networking Fundamentals", "Routing", "Switching", "Network Administration"], image: imageComputer },
  { title: "Database Management", category: "Technology", level: "Professional", subjects: ["SQL", "Database Design", "MongoDB", "Database Administration"], image: imageComputer },
  { title: "Graphic Design", category: "Design", level: "Professional", subjects: ["Design Principles", "Typography", "Branding", "Digital Illustration"], image: imageDesign },
  { title: "UI/UX Design", category: "Design", level: "Professional", subjects: ["User Research", "Wireframing", "Prototyping", "Usability Testing"], image: imageDesign },
  { title: "Digital Marketing", category: "Business", level: "Professional", subjects: ["SEO", "Social Media Marketing", "Content Marketing", "Analytics"], image: imageBusiness },
  { title: "Business Administration", category: "Business", level: "Professional", subjects: ["Management", "Leadership", "Business Strategy", "Operations"], image: imageBusiness },
  { title: "Accounting and Finance", category: "Business", level: "Professional", subjects: ["Financial Accounting", "Cost Accounting", "Auditing", "Corporate Finance"], image: imageBusiness },
  { title: "Physics", category: "Science", level: "Professional", subjects: ["Classical Mechanics", "Electromagnetism", "Quantum Physics", "Thermodynamics"], image: imageScience },
  { title: "Chemistry", category: "Science", level: "Professional", subjects: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry"], image: imageScience },
  { title: "Biology", category: "Science", level: "Professional", subjects: ["Cell Biology", "Genetics", "Microbiology", "Ecology"], image: imageScience },
  { title: "Mathematics", category: "Science", level: "Professional", subjects: ["Calculus", "Linear Algebra", "Differential Equations", "Statistics"], image: imageScience },
  { title: "Psychology", category: "Social Sciences", level: "Professional", subjects: ["Introduction to Psychology", "Cognitive Psychology", "Developmental Psychology", "Research Methods"], image: imageUniversity },
  { title: "Economics", category: "Business", level: "Professional", subjects: ["Microeconomics", "Macroeconomics", "Development Economics", "Econometrics"], image: imageBusiness },
  { title: "Law", category: "Humanities", level: "Professional", subjects: ["Legal Systems", "Constitutional Law", "Contract Law", "International Law"], image: imageUniversity },
  { title: "Education", category: "Humanities", level: "Professional", subjects: ["Teaching Methods", "Educational Psychology", "Curriculum Design", "Assessment"], image: imageUniversity },
  { title: "Languages and Literature", category: "Humanities", level: "Professional", subjects: ["English Literature", "Linguistics", "Academic Writing", "Language Learning"], image: imageUniversity },
  { title: "Engineering", category: "Engineering", level: "Professional", subjects: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Engineering Mathematics"], image: imageScience },
  { title: "Medical and Health Sciences", category: "Health Sciences", level: "Professional", subjects: ["Anatomy", "Physiology", "Biochemistry", "Public Health"], image: imageScience },
  { title: "Environmental Science", category: "Science", level: "Professional", subjects: ["Climate Science", "Ecology", "Conservation", "Environmental Management"], image: imageScience },
  { title: "Research Methods", category: "Research", level: "Professional", subjects: ["Research Design", "Academic Writing", "Data Collection", "Research Ethics"], image: imageUniversity }
];

const degreeCourses = [
  { title: "Associate Degree Programs", category: "College", level: "College", subjects: ["Arts", "Science", "Business", "Computer Studies"], image: imageUniversity },
  { title: "FA and Arts", category: "College", level: "College", subjects: ["English", "Urdu", "Civics", "Education", "Economics", "History"], image: imageUniversity },
  { title: "FSc Pre-Medical", category: "College", level: "College", subjects: ["Biology", "Chemistry", "Physics", "English"], image: imageScience },
  { title: "FSc Pre-Engineering", category: "College", level: "College", subjects: ["Mathematics", "Physics", "Chemistry", "English"], image: imageScience },
  { title: "ICS", category: "College", level: "College", subjects: ["Computer Science", "Mathematics", "Physics", "Statistics"], image: imageComputer },
  { title: "ICom", category: "College", level: "College", subjects: ["Accounting", "Business", "Economics", "Commerce"], image: imageBusiness },
  { title: "BS Computer Science", category: "Undergraduate", level: "Undergraduate", subjects: ["Programming", "Data Structures", "Algorithms", "Operating Systems", "Databases"], image: imageComputer },
  { title: "BS Software Engineering", category: "Undergraduate", level: "Undergraduate", subjects: ["Software Design", "Programming", "Software Testing", "Project Management"], image: imageComputer },
  { title: "BS Information Technology", category: "Undergraduate", level: "Undergraduate", subjects: ["IT Fundamentals", "Networking", "Databases", "Web Technologies"], image: imageComputer },
  { title: "BS Artificial Intelligence", category: "Undergraduate", level: "Undergraduate", subjects: ["Python", "Machine Learning", "Deep Learning", "Data Science"], image: imageComputer },
  { title: "BS Data Science", category: "Undergraduate", level: "Undergraduate", subjects: ["Statistics", "Data Mining", "Python", "Machine Learning"], image: imageComputer },
  { title: "BBA", category: "Undergraduate", level: "Undergraduate", subjects: ["Management", "Marketing", "Finance", "Human Resources"], image: imageBusiness },
  { title: "BCom", category: "Undergraduate", level: "Undergraduate", subjects: ["Accounting", "Auditing", "Business Law", "Taxation"], image: imageBusiness },
  { title: "BS Mathematics", category: "Undergraduate", level: "Undergraduate", subjects: ["Calculus", "Algebra", "Statistics", "Numerical Analysis"], image: imageScience },
  { title: "BS Physics", category: "Undergraduate", level: "Undergraduate", subjects: ["Mechanics", "Electromagnetism", "Quantum Physics", "Thermodynamics"], image: imageScience },
  { title: "BS Chemistry", category: "Undergraduate", level: "Undergraduate", subjects: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry"], image: imageScience },
  { title: "BS Biology", category: "Undergraduate", level: "Undergraduate", subjects: ["Genetics", "Microbiology", "Cell Biology", "Ecology"], image: imageScience },
  { title: "BS Psychology", category: "Undergraduate", level: "Undergraduate", subjects: ["Cognitive Psychology", "Social Psychology", "Research Methods", "Developmental Psychology"], image: imageUniversity },
  { title: "BS English", category: "Undergraduate", level: "Undergraduate", subjects: ["Literature", "Linguistics", "Grammar", "Academic Writing"], image: imageUniversity },
  { title: "BS Economics", category: "Undergraduate", level: "Undergraduate", subjects: ["Microeconomics", "Macroeconomics", "Econometrics", "Development Economics"], image: imageBusiness },
  { title: "MBBS Study Resources", category: "Health Sciences", level: "Undergraduate", subjects: ["Anatomy", "Physiology", "Biochemistry", "Pathology"], image: imageScience },
  { title: "Doctor of Pharmacy", category: "Health Sciences", level: "Undergraduate", subjects: ["Pharmacology", "Pharmaceutics", "Medicinal Chemistry", "Pharmacognosy"], image: imageScience },
  { title: "BS Civil Engineering", category: "Engineering", level: "Undergraduate", subjects: ["Structural Engineering", "Geotechnical Engineering", "Surveying", "Fluid Mechanics"], image: imageScience },
  { title: "BS Electrical Engineering", category: "Engineering", level: "Undergraduate", subjects: ["Circuit Analysis", "Electronics", "Power Systems", "Control Systems"], image: imageScience },
  { title: "MS Computer Science", category: "Postgraduate", level: "Postgraduate", subjects: ["Advanced Algorithms", "AI Research", "Distributed Systems", "Advanced Databases"], image: imageComputer },
  { title: "MS Data Science", category: "Postgraduate", level: "Postgraduate", subjects: ["Advanced Statistics", "Machine Learning", "Big Data", "Research Project"], image: imageComputer },
  { title: "MBA", category: "Postgraduate", level: "Postgraduate", subjects: ["Strategic Management", "Finance", "Marketing", "Business Analytics"], image: imageBusiness },
  { title: "MPhil Education", category: "Postgraduate", level: "MPhil", subjects: ["Advanced Pedagogy", "Educational Research", "Curriculum Studies", "Thesis"], image: imageUniversity },
  { title: "MSc Mathematics", category: "Postgraduate", level: "Postgraduate", subjects: ["Real Analysis", "Abstract Algebra", "Topology", "Applied Mathematics"], image: imageScience },
  { title: "PhD Computer Science", category: "Doctoral", level: "PhD", subjects: ["Advanced Computing Research", "AI Research", "Algorithms Research", "Dissertation"], image: imageComputer },
  { title: "PhD Artificial Intelligence", category: "Doctoral", level: "PhD", subjects: ["Machine Learning Research", "Deep Learning Research", "AI Ethics", "Dissertation"], image: imageComputer },
  { title: "PhD Physics", category: "Doctoral", level: "PhD", subjects: ["Theoretical Physics", "Experimental Research", "Quantum Mechanics", "Dissertation"], image: imageScience },
  { title: "PhD Biology", category: "Doctoral", level: "PhD", subjects: ["Molecular Biology", "Genetics Research", "Bioinformatics", "Dissertation"], image: imageScience },
  { title: "PhD Business and Management", category: "Doctoral", level: "PhD", subjects: ["Management Research", "Business Strategy", "Research Methods", "Dissertation"], image: imageBusiness }
];

const schoolCourses = Array.from({ length: 12 }, (_, index) => {
  const classNumber = index + 1;

  return {
    id: `school-${classNumber}`,
    title: `Class ${classNumber} Complete Study Program`,
    category: `Class ${classNumber}`,
    level:
      classNumber <= 5
        ? "Primary"
        : classNumber <= 8
          ? "Middle"
          : classNumber <= 10
            ? "Secondary"
            : "Higher Secondary",
    subjects: schoolSubjects[classNumber],
    image: schoolClassImages[index],
    boards: pakistanBoards,
    description: `Study the main subjects of Class ${classNumber} with organized topics, video lesson searches and learning resources.`
  };
});

const allCourses = [
  ...schoolCourses,
  ...degreeCourses.map((course, index) => ({
    ...course,
    id: `degree-${index}`,
    image: course.image || imageUniversity,
    description: `Explore ${course.title}, its major subjects, learning topics and video lesson resources.`
  })),
  ...professionalCourses.map((course, index) => ({
    ...course,
    id: `professional-${index}`,
    image: course.image || imageComputer,
    description: `Explore ${course.title} through its key subjects, learning topics and video lesson resources.`
  }))
];

const allSubjects = [
  ...new Set(allCourses.flatMap((course) => course.subjects))
].sort();

const isSchoolCategory = (value) =>
  /^Class (?:[1-9]|1[0-2])$/.test(value);

const subjectGroupRules = [
  ["Mathematics", /\b(math|algebra|geometry|calculus|statistics|probability|topology|econometrics)\b/i],
  ["Programming & Technology", /\b(programming|computer|software|algorithm|database|data science|machine learning|deep learning|artificial intelligence|network|cyber|cloud|android|ios|web development|operating system|distributed system|neural network|cryptography|virtualization|big data|sql|python|html|javascript|react|node\.js)\b/i],
  ["Languages & Communication", /\b(english|urdu|language|grammar|vocabulary|reading|writing|literature|comprehension|essay|communication|typography)\b/i],
  ["Science & Health", /\b(science|physics|chemistry|biology|anatomy|physiology|biochemistry|pathology|pharmacology|pharmaceutics|pharmacognosy|medicinal chemistry|genetics|ecology|molecular biology|quantum|mechanics|electromagnetism|thermodynamics|organic chemistry|inorganic chemistry|cell biology|human physiology)\b/i],
  ["Business & Economics", /\b(business|accounting|finance|economics|management|marketing|leadership|strategy|operations|auditing|corporate finance|microeconomics|macroeconomics)\b/i],
  ["Engineering", /\b(engineering|structural|geotechnical|surveying|fluid mechanics|circuit analysis|electronics|power systems|control systems)\b/i],
  ["Design & Creative Arts", /\b(design|illustration|branding|user research|wireframing|prototyping|usability)\b/i],
  ["Social Studies & Humanities", /\b(social studies|history|geography|civics|culture|psychology|law|education|pedagogy|curriculum|ethics|environment|research methods|thesis|dissertation)\b/i]
];

const getSubjectGroup = (subjectName) =>
  subjectGroupRules.find(([, pattern]) => pattern.test(subjectName))?.[0] ||
  "Other Subjects";

const schoolLevels = ["Primary", "Middle", "Secondary", "Higher Secondary"];
const educationLevelGroups = {
  School: schoolLevels,
  College: ["College"],
  University: ["Undergraduate", "Postgraduate", "MPhil", "PhD"],
  "Online Courses": ["Professional"]
};

const matchesEducationLevel = (courseLevel, selectedLevel) =>
  selectedLevel === "All" ||
  (educationLevelGroups[selectedLevel] || [selectedLevel]).includes(courseLevel);

const matchesCourseEducationLevel = (course, selectedLevel) => {
  if (selectedLevel === "School") {
    const number = Number(course.category.match(/^Class (\d+)$/)?.[1]);
    return number >= 1 && number <= 10;
  }
  return matchesEducationLevel(course.level, selectedLevel);
};

function matchesAcademicDetails(course, profile, profileSubjects) {
  if (profile.educationLevel === "school" && profile.classNumber) {
    return course.category === `Class ${profile.classNumber}`;
  }

  if (profile.educationLevel === "intermediate") {
    const courseYear = Number(course.intermediateYear || course.year || 0);
    if (courseYear && profile.intermediateYear && courseYear !== Number(profile.intermediateYear)) return false;
    const courseTitlesByStream = {
      PreMedical: "FSc Pre-Medical",
      PreEngineering: "FSc Pre-Engineering",
      ICS: "ICS",
      Commerce: "ICom",
      Arts: "FA and Arts",
    };
    const streamTitle = courseTitlesByStream[profile.stream];
    return !streamTitle || normalizeRecommendationText(course.title).includes(normalizeRecommendationText(streamTitle));
  }

  if (profile.educationLevel === "university") {
    const degreeLevels = {
      bs: ["Undergraduate"],
      masters: ["Postgraduate", "MPhil"],
      phd: ["PhD"],
    };
    if (profile.degreeLevel && !degreeLevels[profile.degreeLevel]?.includes(course.level)) return false;
  }

  if (["university", "online"].includes(profile.educationLevel) && profile.program) {
    const program = normalizeRecommendationText(profile.program);
    const courseTitle = normalizeRecommendationText(course.title);
    const titleMatches = courseTitle.includes(program) || program.includes(courseTitle);
    const selectedSubjects = new Set(profileSubjects.map(normalizeRecommendationText));
    const subjectMatches = course.subjects.some((item) => selectedSubjects.has(normalizeRecommendationText(item)));
    return titleMatches || subjectMatches;
  }

  return true;
}

function makeVideoSearch(course, subject, chapter) {
  const query = encodeURIComponent(
    `${course.title} ${subject} ${chapter} educational lesson`
  );

  return `https://www.youtube.com/results?search_query=${query}`;
}

function ExploreCourses({
  initialSearch = "",
  initialCategory = "All"
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState("All");
  const [subject, setSubject] = useState("All");
  const [sort, setSort] = useState("name");
  const [selectedBoard, setSelectedBoard] = useState("All");
  const [academicDetails, setAcademicDetails] = useState({
    classNumber: "",
    intermediateYear: "",
    stream: "PreEngineering",
    degreeLevel: "",
    programChoice: "",
    customProgram: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [page, setPage] = useState(1);

  // Resets dependent filters and pagination when the URL-selected filters change.
  useEffect(() => {
    setSearch(initialSearch);
    setCategory(initialCategory);
    setLevel("All");
    setSubject("All");
    setSelectedBoard("All");
    setAcademicDetails({
      classNumber: "",
      intermediateYear: "",
      stream: "PreEngineering",
      degreeLevel: "",
      programChoice: "",
      customProgram: "",
    });
    setPage(1);
    setSelectedCourse(null);
  }, [initialSearch, initialCategory]);

  const categories = useMemo(
    () => [...new Set(allCourses.map((course) => course.category))],
    []
  );

  const showBoardFilter =
    isSchoolCategory(category) || level === "School" || schoolLevels.includes(level);
  const selectedProgram = academicDetails.programChoice === "Other"
    ? academicDetails.customProgram.trim()
    : academicDetails.programChoice;
  const studentAcademicProfile = {
    educationLevel: {
      School: "school",
      College: "intermediate",
      University: "university",
      "Online Courses": "online",
    }[level] || "",
    classNumber: academicDetails.classNumber,
    intermediateYear: academicDetails.intermediateYear,
    stream: academicDetails.stream,
    degreeLevel: academicDetails.degreeLevel,
    programChoice: academicDetails.programChoice,
    program: selectedProgram,
  };
  const profileSubjects = getStudentAcademicSubjects(studentAcademicProfile);
  const subjectCourses = allCourses.filter((course) => {
    if (category !== "All" && course.category !== category) return false;
    if (!matchesCourseEducationLevel(course, level)) return false;
    if (!matchesAcademicDetails(course, studentAcademicProfile, profileSubjects)) return false;
    if (
      showBoardFilter &&
      selectedBoard !== "All" &&
      course.category.startsWith("Class ") &&
      !course.boards?.includes(selectedBoard)
    ) {
      return false;
    }
    return true;
  });
  const subjectGroups = subjectCourses.reduce((groups, course) => {
    course.subjects.forEach((item) => {
      const groupName = getSubjectGroup(item);
      if (!groups[groupName]) groups[groupName] = new Set();
      groups[groupName].add(item);
    });
    return groups;
  }, {});
  const filterSubjectGroups = profileSubjects.length
    ? profileSubjects.reduce((groups, item) => {
        const groupName = getSubjectGroup(item);
        if (!groups[groupName]) groups[groupName] = new Set();
        groups[groupName].add(item);
        return groups;
      }, {})
    : subjectGroups;

  const pageTitle =
    search.trim() || (category !== "All" ? category : "Explore Courses and Subjects");
  const isSpecificPage = search.trim() !== "" || category !== "All";

  const filteredCourses = useMemo(() => {
    return allCourses
      .filter((course) => {
        const searchable = [
          course.title,
          course.category,
          course.level,
          course.description,
          ...course.subjects
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(search.toLowerCase().trim());
      })
      .filter((course) => category === "All" || course.category === category)
      .filter((course) => matchesCourseEducationLevel(course, level))
      .filter((course) => matchesAcademicDetails(course, studentAcademicProfile, profileSubjects))
      .filter((course) => subject === "All" || course.subjects.includes(subject))
      .filter((course) => {
        if (!showBoardFilter || selectedBoard === "All") {
          return true;
        }

        return (
          !course.category.startsWith("Class ") ||
          course.boards?.includes(selectedBoard)
        );
      })
      .sort((a, b) => {
        if (sort === "name") return a.title.localeCompare(b.title);
        if (sort === "level") return a.level.localeCompare(b.level);
        return a.title.localeCompare(b.title);
      });
  }, [search, category, level, subject, sort, selectedBoard, showBoardFilter, academicDetails, selectedProgram, profileSubjects]);

  const coursesPerPage = 9;
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const safePage = Math.min(page, Math.max(totalPages, 1));

  const visibleCourses = filteredCourses.slice(
    (safePage - 1) * coursesPerPage,
    safePage * coursesPerPage
  );
  const headerCourse = filteredCourses[0] || allCourses.find((course) => course.category === category);
  const headerImage = headerCourse?.image || imageSchool;
  const headerImageAlt = headerCourse?.title || "Students learning";
  const selectedClassNumber = Number(category.match(/^Class (\d+)$/)?.[1]);
  const matchingClassNumber = Number(
    headerCourse?.category.match(/^Class (\d+)$/)?.[1]
  );
  const classNumber =
    selectedClassNumber ||
    (search.trim() && matchingClassNumber ? matchingClassNumber : null);
  const headerTheme = classNumber
    ? headerThemes[(classNumber - 1) % headerThemes.length]
    : categoryHeaderThemes[headerCourse?.category] || ["#3b0764", "#7c3aed"];

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setLevel("All");
    setSubject("All");
    setSort("name");
    setSelectedBoard("All");
    setAcademicDetails({
      classNumber: "",
      intermediateYear: "",
      stream: "PreEngineering",
      degreeLevel: "",
      programChoice: "",
      customProgram: "",
    });
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSelectedBoard("All");
    setSubject("All");
    if (
      value !== "All" &&
      level !== "All" &&
      !allCourses.some(
        (course) => course.category === value && matchesCourseEducationLevel(course, level)
      )
    ) {
      setLevel("All");
    }
    setPage(1);
  };

  const handleLevelChange = (value) => {
    setLevel(value);
    setSelectedBoard("All");
    setSubject("All");
    setAcademicDetails({
      classNumber: "",
      intermediateYear: "",
      stream: "PreEngineering",
      degreeLevel: "",
      programChoice: "",
      customProgram: "",
    });
    setPage(1);
    if (
      value !== "All" &&
      category !== "All" &&
      !allCourses.some(
        (course) => course.category === category && matchesCourseEducationLevel(course, value)
      )
    ) {
      setCategory("All");
    }
  };

  const selectCourse = (course) => {
    setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedCourse) {
    const chapters = selectedCourse.subjects.map((item) => ({
      subject: item,
      chapters: chapterLibrary[item] || [
        `Introduction to ${item}`,
        `${item} Fundamentals`,
        `Important Concepts in ${item}`,
        `${item} Applications and Practice`
      ]
    }));

    return (
      <div className="explore-page">
        <div className="explore-detail-top">
          <button
            className="back-button"
            onClick={() => setSelectedCourse(null)}
          >
            ← Back to Courses
          </button>
        </div>

        <section className="course-detail-page">
          <ResilientImage
            className="course-detail-image"
            src={selectedCourse.image}
            alt={selectedCourse.title}
          />

          <div className="course-detail-info">
            <span className="course-category">
              {selectedCourse.category}
            </span>

            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.description}</p>

            <div className="detail-meta">
              <span>📚 {selectedCourse.subjects.length} Subjects</span>
              <span>🎓 {selectedCourse.level}</span>
              <span>🆓 Learning Resources</span>
            </div>

            <h2>Subjects and Specializations</h2>

            <div className="subject-list">
              {selectedCourse.subjects.map((item) => (
                <span className="subject-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <h2>Topics and Video Lessons</h2>
            <p>
              Choose a topic to find educational video lessons.
              Video links currently open YouTube search results.
            </p>

            <div className="chapter-list">
              {chapters.map(
                ({ subject: subjectName, chapters: subjectChapters }) => (
                  <div className="chapter-subject" key={subjectName}>
                    <h3>{subjectName}</h3>

                    {subjectChapters.map((chapter, index) => (
                      <div className="chapter-row" key={chapter}>
                        <span>
                          <strong>Topic {index + 1}:</strong> {chapter}
                        </span>

                        <a
                          href={makeVideoSearch(
                            selectedCourse,
                            subjectName,
                            chapter
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="video-link"
                        >
                          ▶ Watch Videos
                        </a>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <h2>Study Resources</h2>
            <p>
              This catalog is a learning structure and starting library.
              Individual notes, worksheets, verified video links and complete
              syllabuses can be added to each course as content is developed.
            </p>

            <button
              className="enroll-button"
              onClick={() => {
                const firstSubject = selectedCourse.subjects[0];
                const firstChapter =
                  chapterLibrary[firstSubject]?.[0] || "Introduction";

                window.open(
                  makeVideoSearch(
                    selectedCourse,
                    firstSubject,
                    firstChapter
                  ),
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              Start Learning
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <section className="explore-header">
        {classNumber ? (
          <ClassBooksArtwork
            key={headerCourse?.id}
            className="explore-header-image class-books-artwork"
            classNumber={classNumber}
          />
        ) : (
          <ResilientImage
            key={headerCourse?.id || headerImage}
            className="explore-header-image"
            src={headerImage}
            alt={headerImageAlt}
          />
        )}
        <div
          key={headerCourse?.id || headerCourse?.category || "default"}
          className={`explore-header-image-overlay${classNumber ? " class-books-overlay" : ""}`}
          style={{
            "--header-color-start": headerTheme[0],
            "--header-color-end": headerTheme[1]
          }}
          aria-hidden="true"
        />
        <span className="explore-tag">
          {isSpecificPage ? "SUBJECT LEARNING PAGE" : "GLOBAL LEARNING LIBRARY"}
        </span>

        <h1 key={pageTitle} className="explore-header-title">
          {pageTitle}
        </h1>

        <p key={headerCourse?.id || pageTitle} className="explore-header-description">
          {search.trim()
            ? `Explore courses, subjects and learning resources for ${search.trim()}.`
            : category !== "All"
              ? `Explore courses and learning resources for ${category}.`
              : "From school education to university degrees, research and professional skills."}
        </p>

        <div className="explore-search">
          <input
            type="text"
            placeholder="Search course, subject, degree or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <span>⌕</span>
        </div>

        <div className="explore-library-count">
          {allCourses.length} course programs · {allSubjects.length} subject areas
        </div>
      </section>

      <section className="explore-content">
        <aside className="course-filters">
          <div className="filter-heading">
            <h2>Filters</h2>
            <button onClick={resetFilters}>Reset</button>
          </div>

          <div className="filter-group">
            <h3>Course Category</h3>

            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="All">All Categories</option>

              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="academic-filter-grid">
          <div className="filter-group">
            <h3>Education Level</h3>
            <select
              value={level}
              onChange={(event) => handleLevelChange(event.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="School">School</option>
              <option value="College">College / Intermediate</option>
              <option value="University">University</option>
              <option value="Online Courses">Online Courses</option>
            </select>
          </div>

          {showBoardFilter && (
            <div className="filter-group">
              <h3>Pakistan Education Board</h3>

              <select
                value={selectedBoard}
                onChange={(e) => {
                  setSelectedBoard(e.target.value);
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="All">All Boards</option>

                {pakistanBoards.map((board) => (
                  <option value={board} key={board}>
                    {board}
                  </option>
                ))}
              </select>

              <small>
                Select your board to choose your school education board.
              </small>
            </div>
          )}

          {level === "School" && (
            <div className="filter-group">
              <h3>Class</h3>
              <select
                value={academicDetails.classNumber}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({ ...previous, classNumber: event.target.value }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="">Select your class</option>
                {Array.from({ length: 10 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>Class {index + 1}</option>
                ))}
              </select>
            </div>
          )}

          {level === "College" && <>
            <div className="filter-group">
              <h3>Year</h3>
              <select
                value={academicDetails.intermediateYear}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({ ...previous, intermediateYear: event.target.value }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="">Select your year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
              </select>
            </div>
            <div className="filter-group">
              <h3>College Program / Group</h3>
              <select
                value={academicDetails.stream}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({ ...previous, stream: event.target.value }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                {INTERMEDIATE_STREAMS.map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </div>
          </>}

          {level === "University" && <>
            <div className="filter-group">
              <h3>Degree Level</h3>
              <select
                value={academicDetails.degreeLevel}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({
                    ...previous,
                    degreeLevel: event.target.value,
                    programChoice: "",
                    customProgram: "",
                  }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="">Select degree</option>
                <option value="bs">BS / Bachelor's</option>
                <option value="masters">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            {academicDetails.degreeLevel && <div className="filter-group">
              <h3>{academicDetails.degreeLevel === "bs" ? "BS / Bachelor's Program" : academicDetails.degreeLevel === "masters" ? "Master's Program" : "PhD Program"}</h3>
              <select
                value={academicDetails.programChoice}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({
                    ...previous,
                    programChoice: event.target.value,
                    customProgram: "",
                  }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="">Select a program</option>
                {getProgramGroupsForDegreeLevel(academicDetails.degreeLevel).map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.programs.map((program) => <option key={program} value={program}>{program}</option>)}
                  </optgroup>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>}
            {academicDetails.programChoice === "Other" && <div className="filter-group">
              <h3>Enter Your Program</h3>
              <input
                maxLength={100}
                value={academicDetails.customProgram}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({ ...previous, customProgram: event.target.value }));
                  setSubject("All");
                  setPage(1);
                }}
                placeholder="Type your degree program"
              />
            </div>}
          </>}

          {level === "Online Courses" && <>
            <div className="filter-group">
              <h3>Interest</h3>
              <select
                value={academicDetails.programChoice}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({
                    ...previous,
                    programChoice: event.target.value,
                    customProgram: "",
                  }));
                  setSubject("All");
                  setPage(1);
                }}
              >
                <option value="">Choose a course</option>
                {ONLINE_COURSES.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            {academicDetails.programChoice === "Other" && <div className="filter-group">
              <h3>Enter Course Name</h3>
              <input
                maxLength={100}
                value={academicDetails.customProgram}
                onChange={(event) => {
                  setAcademicDetails((previous) => ({ ...previous, customProgram: event.target.value }));
                  setSubject("All");
                  setPage(1);
                }}
                placeholder="Type the course area"
              />
            </div>}
          </>}

          </div>

          {profileSubjects.length > 0 && (
            <div className="explore-profile-subject-preview">
              <strong>Related subjects</strong>
              <p>{profileSubjects.join(" · ")}</p>
            </div>
          )}

          <div className="filter-group">
            <h3>Subject</h3>
            <select
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Subjects</option>
              {Object.entries(filterSubjectGroups)
                .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                .map(([groupName, subjects]) => (
                  <optgroup label={groupName} key={groupName}>
                    {[...subjects]
                      .sort((subjectA, subjectB) => subjectA.localeCompare(subjectB))
                      .map((item) => <option value={item} key={item}>{item}</option>)}
                  </optgroup>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Sort Courses</h3>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Course Name</option>
              <option value="level">Education Level</option>
            </select>
          </div>
        </aside>

        <div className="course-results">
          <div className="results-top">
            <div>
              <h2>
                {search.trim()
                  ? `${search.trim()} Learning Programs`
                  : category === "All"
                    ? "All Learning Programs"
                    : category}
              </h2>

              <p>{filteredCourses.length} courses found</p>

              {showBoardFilter && selectedBoard !== "All" && (
                <p>
                  Selected Board: <strong>{selectedBoard}</strong>
                </p>
              )}
            </div>
          </div>

          {showBoardFilter && selectedBoard !== "All" && (
            <div className="board-info">
              <p>
                You selected {selectedBoard}. Board-specific books,
                syllabus and chapter content will be added as those
                materials are entered into the learning library.
              </p>
            </div>
          )}
          <PublishedCourses
            educationProfile={level === "All" ? null : studentAcademicProfile}
            subjectFilter={subject}
          />
          <div className="explore-course-grid">
            {visibleCourses.map((course) => (
              <article className="explore-course-card" key={course.id}>
                <ResilientImage src={course.image} alt={course.title} />

                <div className="explore-course-info">
                  <span className="course-category">
                    {course.category}
                  </span>

                  <h3>{course.title}</h3>

                  <p className="course-instructor">
                    {course.level} Education
                  </p>

                  <div className="course-meta">
                    <span>📚 {course.subjects.length} Subjects</span>
                    <span>▶ Video Topics</span>
                  </div>

                  <div className="course-meta">
                    <span>{course.subjects.slice(0, 3).join(" · ")}</span>
                  </div>

                  <div className="course-card-bottom">
                    <strong>Explore</strong>

                    <button onClick={() => selectCourse(course)}>
                      View Course
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleCourses.length === 0 && (
            <div className="no-courses">
              <h3>No courses found</h3>
              <p>Try another search term or change your filters.</p>
              <button onClick={resetFilters}>Clear Filters</button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={safePage === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <span>
                Page {safePage} of {totalPages}
              </span>

              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ExploreCourses;
