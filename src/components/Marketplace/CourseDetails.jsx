
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addToCart,
  getStudentEmail,
  getEnrollments,
} from "../../utils/studentCart";

import {
  BookOpen,
  ArrowLeft,
  GraduationCap,
  PlayCircle,
  Clock3,
  UserRound,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";

import "./CourseDetails.css";

export default function CourseDetails({
  course,
  onBack,
  onOpenCart,
}) {
  const navigate = useNavigate();
  const [cartMessage, setCartMessage] = useState("");

  const lessons = Array.isArray(course?.lessons)
    ? course.lessons
    : [];

  const instructor = course?.instructorProfile || {};

  function handleAddToCart() {
    const email = getStudentEmail();

    if (!email) {
      navigate("/login");
      return;
    }

    if (!course) return;

    const alreadyEnrolled = getEnrollments(email).some(
      (item) => String(item.id) === String(course.id)
    );

    if (alreadyEnrolled) {
      setCartMessage(
        "You are already enrolled in this course."
      );
      return;
    }

    const added = addToCart(email, course);

    setCartMessage(
      added
        ? "Course added to cart successfully!"
        : "This course is already in your cart."
    );
  }

 
function handleViewCart() {
  const email = getStudentEmail();

  if (!email) {
    navigate("/login");
    return;
  }

  onOpenCart();
}


  if (!course) return null;

  return (
    <div className="edc-course-details">
      <button
        className="edc-details-back"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      <div className="edc-details-layout">
        <div className="edc-details-main">
          <span className="edc-details-category">
            {course.category || "General"}
          </span>

          <h1>{course.title}</h1>

          <p className="edc-details-description">
            {course.description ||
              "Learn with EduConnect AI."}
          </p>

          <div className="edc-details-meta">
            <span>
              <GraduationCap size={17} />
              {course.level || "All Levels"}
            </span>

            <span>
              <BookOpen size={17} />
              {lessons.length} Lessons
            </span>
          </div>

          <section className="edc-details-section">
            <h2>Course Curriculum</h2>

            <p>
              Explore the lessons included in this course.
            </p>

            {lessons.length === 0 ? (
              <div className="edc-details-empty">
                No lessons have been added yet.
              </div>
            ) : (
              <div className="edc-details-lessons">
                {lessons.map((lesson, index) => (
                  <div
                    className="edc-details-lesson"
                    key={lesson.id || index}
                  >
                    <div className="edc-details-lesson-icon">
                      <PlayCircle size={21} />
                    </div>

                    <div className="edc-details-lesson-info">
                      <strong>
                        {index + 1}. {lesson.title}
                      </strong>

                      {lesson.description && (
                        <p>{lesson.description}</p>
                      )}

                      <div className="edc-details-lesson-meta">
                        {lesson.duration && (
                          <span>
                            <Clock3 size={14} />
                            {lesson.duration}
                          </span>
                        )}

                        {lesson.isFreePreview && (
                          <span className="edc-details-preview">
                            Free Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="edc-details-section">
            <h2>Meet Your Instructor</h2>

            <div className="edc-details-instructor">
              {instructor.avatar ? (
                <img
                  src={instructor.avatar}
                  alt={
                    course.instructorName ||
                    "Course instructor"
                  }
                />
              ) : (
                <div className="edc-details-avatar">
                  <UserRound size={28} />
                </div>
              )}

              <div>
                <h3>
                  {course.instructorName ||
                    "EduConnect Instructor"}
                </h3>

                {instructor.headline && (
                  <p>{instructor.headline}</p>
                )}

                {instructor.expertise && (
                  <p>
                    Expertise: {instructor.expertise}
                  </p>
                )}

                {instructor.bio && (
                  <p>{instructor.bio}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="edc-details-sidebar">
          <div className="edc-details-thumbnail">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
              />
            ) : (
              <GraduationCap size={54} />
            )}
          </div>

          <div className="edc-details-sidebar-body">
            <span className="edc-details-price-label">
              Course Price
            </span>

            <strong className="edc-details-price">
              PKR{" "}
              {Number(
                course.price || 0
              ).toLocaleString()}
            </strong>

            <button
              className="edc-details-enroll edc-details-enroll-primary"
              type="button"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>

            <button
              className="edc-details-enroll edc-details-enroll-secondary"
              type="button"
              onClick={handleViewCart}
            >
              <ShoppingCart size={18} />
              View Cart
            </button>

            {cartMessage && (
              <p
                role="status"
                className="edc-details-sidebar-note"
                data-state={cartMessage.includes("successfully") ? "success" : "info"}
              >
                <CheckCircle2 size={16} />
                {cartMessage}
              </p>
            )}

            <p className="edc-details-sidebar-note">
              Add this course to your cart and complete
              demo checkout to enroll. No real payment
              will be collected.
            </p>

            <div className="edc-details-includes">
              <h3>This Course Includes</h3>

              <p>
                <BookOpen size={17} />
                {lessons.length} Lessons
              </p>

              <p>
                <GraduationCap size={17} />
                {course.level || "All Levels"}
              </p>

              <p>
                <PlayCircle size={17} />
                Free preview labels where available
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
