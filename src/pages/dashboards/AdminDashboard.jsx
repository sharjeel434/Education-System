
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
import {
  notifyAdminDataChanged,
  ADMIN_USERS_KEY,
  getAdminCourses,
  readAdminArray,
} from "../../components/admin/adminData";

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

function AdminDashboard({ initialTab = "teachers", onSectionChange }) {
  const [users, setUsers] = useState(() =>
    readAdminArray(ADMIN_USERS_KEY)
  );

  const [courses, setCourses] = useState(() =>
    getAdminCourses(readAdminArray(ADMIN_USERS_KEY))
  );

  const [tab, setTab] = useState(initialTab);

  function refreshData() {
    const latestUsers = readAdminArray(ADMIN_USERS_KEY);
    setUsers(latestUsers);
    setCourses(getAdminCourses(latestUsers));
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
      ADMIN_USERS_KEY,
      JSON.stringify(updatedUsers)
    );

    notifyAdminDataChanged();
    setUsers(updatedUsers);
  }

  function updateCourseStatus(
    teacherEmail,
    courseId,
    status
  ) {
    const key =
      `educonnect.teacher.${teacherEmail}.courses`;

    const updated = readAdminArray(key).map((course) =>
      course.id === courseId
        ? { ...course, status }
        : course
    );

    window.localStorage.setItem(
      key,
      JSON.stringify(updated)
    );

    notifyAdminDataChanged();
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

    const updated = readAdminArray(key).filter(
      (course) => course.id !== courseId
    );

    window.localStorage.setItem(
      key,
      JSON.stringify(updated)
    );

    notifyAdminDataChanged();
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
    ["teachers", "Teacher Approvals"],
    ["approvals", "Course Approvals"],
    ["users", "Users"],
    ["courses", "Courses"],
    ["reports", "Reports"],
  ];

  return (
    <section className="dashboard-section">
      <div className="edc-admin-tools-header">
        <div>
          <h3>Existing administration tools</h3>
          <p>These demo workflows use records stored in this browser.</p>
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
            onClick={() => {
              setTab(id);
              onSectionChange?.(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

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
