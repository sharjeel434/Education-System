
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock3,
  GraduationCap,
  ShoppingCart,
} from "lucide-react";

import { getPublishedTeacherCourses } from "../../utils/teacherCourses";
import { getCart, getStudentEmail } from "../../utils/studentCart";

import CourseDetails from "./CourseDetails";
import CartPage from "./CartPage";
import "./PublishedCourses.css";

export default function PublishedCourses() {
  const navigate = useNavigate();

  // Published teacher courses  
  const [courses, setCourses] = useState(() =>
    getPublishedTeacherCourses()
  );

  // Selected course
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Cart page visibility
  const [showCart, setShowCart] = useState(false);

  // Cart item count
  const [cartCount, setCartCount] = useState(() => {
    const email = getStudentEmail();
    return email ? getCart(email).length : 0;
  });

  // Refresh courses and cart
  useEffect(() => {
    function refreshCourses() {
      setCourses(getPublishedTeacherCourses());
    }

    function refreshCart() {
      const email = getStudentEmail();
      setCartCount(email ? getCart(email).length : 0);
    }

    window.addEventListener("storage", refreshCourses);
    window.addEventListener("focus", refreshCourses);
    window.addEventListener("educonnect:teacher-courses-changed", refreshCourses);
    window.addEventListener(
      "educonnect:admin-data-changed",
      refreshCourses
    );

    window.addEventListener("storage", refreshCart);
    window.addEventListener("focus", refreshCart);
    window.addEventListener(
      "educonnect:student-data-changed",
      refreshCart
    );

    return () => {
      window.removeEventListener("storage", refreshCourses);
      window.removeEventListener("focus", refreshCourses);
      window.removeEventListener("educonnect:teacher-courses-changed", refreshCourses);
      window.removeEventListener(
        "educonnect:admin-data-changed",
        refreshCourses
      );

      window.removeEventListener("storage", refreshCart);
      window.removeEventListener("focus", refreshCart);
      window.removeEventListener(
        "educonnect:student-data-changed",
        refreshCart
      );
    };
  }, []);

  function openCart() {
    const email = getStudentEmail();

    if (!email) {
      navigate("/login");
      return;
    }

    setSelectedCourse(null);
    setShowCart(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeCart() {
    setShowCart(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCourse(course) {
    setShowCart(false);
    setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeCourse() {
    setSelectedCourse(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // CART PAGE
  if (showCart) {
    const email = getStudentEmail();

    if (!email) {
      return (
        <section
          className="marketplace-published"
          style={{ textAlign: "center", padding: 40 }}
        >
          <h2>Student Login Required</h2>
          <p>Please log in as a student to view your cart.</p>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Log in as Student
          </button>

          <button
            type="button"
            onClick={closeCart}
            style={{ marginLeft: 12 }}
          >
            Back to Courses
          </button>
        </section>
      );
    }

    return (
      <CartPage
        email={email}
        onBack={closeCart}
        onComplete={() => {
          setShowCart(false);
          navigate("/student/dashboard");
        }}
      />
    );
  }

  // COURSE DETAILS PAGE
  if (selectedCourse) {
    const latestCourse = courses.find(
      (course) =>
        String(course.id) === String(selectedCourse.id) &&
        course.teacherEmail === selectedCourse.teacherEmail
    );

    return (
      <CourseDetails
        course={latestCourse || selectedCourse}
        onBack={closeCourse}
        onOpenCart={openCart}
      />
    );
  }

  // MAIN MARKETPLACE
  return (
    <section className="marketplace-published">
      <div className="marketplace-published-heading">
        <div>
          <span className="marketplace-eyebrow">
            EDUCONNECT AI MARKETPLACE
          </span>

          <h2>Courses From Our Instructors</h2>

          <p>
            Explore courses reviewed and published
            by EduConnect AI.
          </p>
        </div>

        <button
          type="button"
          onClick={openCart}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 10,
            border: "1px solid #ded3f5",
            background: "#ffffff",
            color: "#6d28d9",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <ShoppingCart size={19} />
          My Cart ({cartCount})
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="marketplace-empty">
          <BookOpen size={38} />

          <h3>No published courses yet</h3>

          <p>
            Courses will appear here after
            admin approval.
          </p>
        </div>
      ) : (
        <div className="marketplace-course-grid">
          {courses.map((course) => (
            <article
              className="marketplace-course-card"
              key={`${course.teacherEmail}-${course.id}`}
            >
              {/* Course Thumbnail */}
              <div className="marketplace-course-image">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                  />
                ) : (
                  <GraduationCap size={48} />
                )}
              </div>

              {/* Course Information */}
              <div className="marketplace-course-body">
                <span className="marketplace-course-category">
                  {course.category || "General"}
                </span>

                <h3>{course.title}</h3>

                <p className="marketplace-instructor">
                  By {course.instructorName}
                </p>

                <p className="marketplace-description">
                  {course.description ||
                    "Learn with EduConnect AI."}
                </p>

                {/* Course Metadata */}
                <div className="marketplace-course-meta">
                  <span>
                    <BookOpen size={15} />
                    {Array.isArray(course.lessons)
                      ? course.lessons.length
                      : 0}{" "}
                    Lessons
                  </span>

                  <span>
                    <Clock3 size={15} />
                    {course.level || "All Levels"}
                  </span>
                </div>

                {/* Price and View Course Button */}
                <div className="marketplace-course-bottom">
                  <strong>
                    PKR{" "}
                    {Number(course.price || 0).toLocaleString()}
                  </strong>

                  <button
                    type="button"
                    onClick={() => openCourse(course)}
                  >
                    <BookOpen size={16} />
                    View Course
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
