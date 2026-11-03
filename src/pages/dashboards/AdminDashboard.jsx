
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UsersRound,
  XCircle,
} from "lucide-react";

const USERS_KEY = "educonnect.registeredUsers";

const styles = {
  panel: {
    padding: 20,
    border: "1px solid #e9e5f5",
    borderRadius: 16,
    background: "#fff",
  },
  primary: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 9,
    background: "#6d28d9",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  secondary: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 9,
    background: "#f3edff",
    color: "#6d28d9",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
};

function readArray(key) {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(key) || "[]"
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getAllCourses(users) {
  return users
    .filter((user) => user.role === "Teacher")
    .flatMap((teacher) => {
      const key =
        `educonnect.teacher.${teacher.email}.courses`;

      return readArray(key).map((course) => ({
        ...course,
        teacherEmail: teacher.email,
      }));
    });
}

function AdminDashboard() {
  const [users, setUsers] = useState(() =>
    readArray(USERS_KEY)
  );

  const [courses, setCourses] = useState(() =>
    getAllCourses(readArray(USERS_KEY))
  );

  const [tab, setTab] = useState("overview");

  function refreshData() {
    const latestUsers = readArray(USERS_KEY);
    setUsers(latestUsers);
    setCourses(getAllCourses(latestUsers));
  }

  useEffect(() => {
    function handleStorage() {
      refreshData();
    }

    window.addEventListener("storage", handleStorage);

    return () =>
      window.removeEventListener(
        "storage",
        handleStorage
      );
  }, []);

  function updateTeacherStatus(email, status) {
    const updatedUsers = users.map((user) =>
      user.email === email
        ? { ...user, status }
        : user
    );

    window.localStorage.setItem(
      USERS_KEY,
      JSON.stringify(updatedUsers)
    );

    setUsers(updatedUsers);
  }

  function updateCourseStatus(
    teacherEmail,
    courseId,
    status
  ) {
    const key =
      `educonnect.teacher.${teacherEmail}.courses`;

    const updated = readArray(key).map((course) =>
      course.id === courseId
        ? { ...course, status }
        : course
    );

    window.localStorage.setItem(
      key,
      JSON.stringify(updated)
    );

    refreshData();
  }

  function deleteCourse(teacherEmail, courseId) {
    if (
      !window.confirm(
        "Delete this demo course permanently?"
      )
    ) {
      return;
    }

    const key =
      `educonnect.teacher.${teacherEmail}.courses`;

    const updated = readArray(key).filter(
      (course) => course.id !== courseId
    );

    window.localStorage.setItem(
      key,
      JSON.stringify(updated)
    );

    refreshData();
  }

  const students = users.filter(
    (user) => user.role === "Student"
  );

  const teachers = users.filter(
    (user) => user.role === "Teacher"
  );

  const pendingTeachers = teachers.filter(
    (user) => user.status === "pending"
  );

  const pendingCourses = courses.filter(
    (course) =>
      course.status === "Pending Approval"
  );

  const publishedCourses = courses.filter(
    (course) => course.status === "Published"
  );

  const tabs = [
    ["overview", "Overview"],
    ["teachers", "Teacher Approvals"],
    ["approvals", "Course Approvals"],
    ["users", "Users"],
    ["courses", "Courses"],
    ["reports", "Reports"],
  ];

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <span className="auth-eyebrow">
            ADMIN CONTROL CENTER
          </span>

          <h2>Platform Administration</h2>
        </div>

        <button
          type="button"
          style={styles.secondary}
          onClick={refreshData}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      <div
        className="dashboard-cards"
        style={{ marginBottom: 24 }}
      >
        {[
          {
            label: "Students",
            value: students.length,
            icon: GraduationCap,
          },
          {
            label: "Teachers",
            value: teachers.length,
            icon: UsersRound,
          },
          {
            label: "Courses",
            value: courses.length,
            icon: BookOpen,
          },
          {
            label: "Pending Approvals",
            value:
              pendingTeachers.length +
              pendingCourses.length,
            icon: Clock3,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="dashboard-card"
              key={stat.label}
            >
              <span className="dashboard-card-icon">
                <Icon size={21} />
              </span>

              <h3 style={{ fontSize: 28 }}>
                {stat.value}
              </h3>

              <p>{stat.label}</p>
            </article>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 22,
        }}
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={
              tab === id
                ? styles.primary
                : styles.secondary
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={styles.panel}>
          <h3>Platform Overview</h3>

          <p>
            Registered Students: {students.length}
          </p>

          <p>
            Registered Teachers: {teachers.length}
          </p>

          <p>
            Total Courses: {courses.length}
          </p>

          <p>
            Published Courses: {publishedCourses.length}
          </p>

          <p>
            Pending Teacher Approvals:{" "}
            {pendingTeachers.length}
          </p>

          <p>
            Pending Course Approvals:{" "}
            {pendingCourses.length}
          </p>
        </div>
      )}

      {tab === "teachers" && (
        <div style={{ display: "grid", gap: 15 }}>
          {pendingTeachers.length === 0 ? (
            <div style={styles.panel}>
              <h3>No pending teacher requests</h3>
              <p>
                New teacher signup requests will
                appear here.
              </p>
            </div>
          ) : (
            pendingTeachers.map((teacher) => (
              <article
                key={teacher.email}
                style={styles.panel}
              >
                <h3>{teacher.name}</h3>
                <p>{teacher.email}</p>
                <p>
                  Status: <strong>{teacher.status}</strong>
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    style={styles.primary}
                    onClick={() =>
                      updateTeacherStatus(
                        teacher.email,
                        "approved"
                      )
                    }
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.secondary,
                      color: "#b91c1c",
                    }}
                    onClick={() =>
                      updateTeacherStatus(
                        teacher.email,
                        "rejected"
                      )
                    }
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {tab === "approvals" && (
        <div style={{ display: "grid", gap: 15 }}>
          {pendingCourses.length === 0 ? (
            <div style={styles.panel}>
              <h3>No pending course approvals</h3>
              <p>
                Submitted teacher courses will
                appear here.
              </p>
            </div>
          ) : (
            pendingCourses.map((course) => (
              <article
                key={`${course.teacherEmail}-${course.id}`}
                style={styles.panel}
              >
                <h3>{course.title}</h3>

                <p>
                  Teacher: {course.teacherEmail}
                </p>

                <p>{course.description}</p>

                <p>
                  Lessons: {course.lessons?.length || 0}
                </p>

                <p>
                  Price: PKR {course.price}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    style={styles.primary}
                    onClick={() =>
                      updateCourseStatus(
                        course.teacherEmail,
                        course.id,
                        "Published"
                      )
                    }
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.secondary,
                      color: "#b91c1c",
                    }}
                    onClick={() =>
                      updateCourseStatus(
                        course.teacherEmail,
                        course.id,
                        "Rejected"
                      )
                    }
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "grid", gap: 15 }}>
          {users.length === 0 ? (
            <div style={styles.panel}>
              <p>No registered demo users found.</p>
            </div>
          ) : (
            users.map((user) => (
              <article
                key={user.email}
                style={styles.panel}
              >
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>
                  Status: {user.status || "active"}
                </p>

                {user.role === "Teacher" && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      style={styles.secondary}
                      onClick={() =>
                        updateTeacherStatus(
                          user.email,
                          "approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      style={styles.secondary}
                      onClick={() =>
                        updateTeacherStatus(
                          user.email,
                          "pending"
                        )
                      }
                    >
                      Set Pending
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {tab === "courses" && (
        <div style={{ display: "grid", gap: 15 }}>
          {courses.length === 0 ? (
            <div style={styles.panel}>
              <p>No courses created yet.</p>
            </div>
          ) : (
            courses.map((course) => (
              <article
                key={`${course.teacherEmail}-${course.id}`}
                style={styles.panel}
              >
                <h3>{course.title}</h3>

                <p>
                  Teacher: {course.teacherEmail}
                </p>

                <p>
                  Status: <strong>{course.status}</strong>
                </p>

                <p>
                  Category: {course.category}
                </p>

                <button
                  type="button"
                  style={{
                    ...styles.secondary,
                    color: "#b91c1c",
                  }}
                  onClick={() =>
                    deleteCourse(
                      course.teacherEmail,
                      course.id
                    )
                  }
                >
                  <Trash2 size={16} />
                  Delete Course
                </button>
              </article>
            ))
          )}
        </div>
      )}

      {tab === "reports" && (
        <div style={styles.panel}>
          <h3>Platform Reports</h3>

          <p>
            <UsersRound
              size={16}
              style={{ verticalAlign: "middle" }}
            />{" "}
            Total Users: {users.length}
          </p>

          <p>
            <BookOpen
              size={16}
              style={{ verticalAlign: "middle" }}
            />{" "}
            Total Courses: {courses.length}
          </p>

          <p>
            <CheckCircle2
              size={16}
              style={{ verticalAlign: "middle" }}
            />{" "}
            Published: {publishedCourses.length}
          </p>

          <p>
            <ShieldCheck
              size={16}
              style={{ verticalAlign: "middle" }}
            />{" "}
            Approved Teachers:{" "}
            {
              teachers.filter(
                (user) => user.status === "approved"
              ).length
            }
          </p>

          <p>
            Detailed analytics, payments and
            platform reports will be added after
            backend integration.
          </p>
        </div>
      )}

      <p
        className="dashboard-demo-note"
        style={{ marginTop: 24 }}
      >
        Admin dashboard frontend demo. Approval
        actions update browser localStorage only.
        This is not secure server-side administration.
      </p>
    </section>
  );
}

export default AdminDashboard;
