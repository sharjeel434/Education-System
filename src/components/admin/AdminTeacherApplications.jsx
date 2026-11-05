import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  Info,
  Search,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  ADMIN_USERS_KEY,
  appendAdminActivityRecord,
  getAdminTeachers,
  readAdminArray,
  updateAdminTeacherStatus,
} from "./adminData";

const FILTERS = [
  { id: "all", label: "All Applications" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const DETAIL_FIELDS = [
  ["bio", "About"],
  ["about", "About"],
  ["certifications", "Certifications"],
  ["certificates", "Certificates"],
  ["teachingPhilosophy", "Teaching philosophy"],
  ["languages", "Languages"],
];

function firstValue(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      const text = String(value).trim();
      if (text) return text;
    }

    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      const text = value.map((item) => item.trim()).filter(Boolean).join(", ");
      if (text) return text;
    }
  }

  return "";
}

function applicationStatus(application) {
  return typeof application.status === "string" && application.status.trim()
    ? application.status.trim()
    : "Not provided";
}

function teacherName(application) {
  return firstValue(application, ["name"]) || "Not provided";
}

function normalizedStatus(application) {
  return applicationStatus(application).toLowerCase();
}

function formatApplicationDate(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Not provided";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString();
}

function statusClass(application) {
  const status = normalizedStatus(application);
  if (status === "pending") return "edc-admin-status-pending";
  if (status === "approved") return "edc-admin-status-approved";
  if (status === "rejected") return "edc-admin-status-rejected";
  return "edc-admin-status-unknown";
}

function AdminTeacherApplications() {
  const [applications, setApplications] = useState(() =>
    getAdminTeachers(readAdminArray(ADMIN_USERS_KEY)),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function refreshApplications() {
      setApplications(getAdminTeachers(readAdminArray(ADMIN_USERS_KEY)));
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedApplication(null);
    }

    window.addEventListener("storage", refreshApplications);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshApplications);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("storage", refreshApplications);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshApplications);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "all" ||
        normalizedStatus(application) === statusFilter;
      const searchableText = [
        application.name,
        application.email,
        firstValue(application, [
          "subject",
          "specialization",
          "teachingSpecialization",
          "teachingSubject",
        ]),
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [applications, search, statusFilter]);

  function changeApplicationStatus(application, nextStatus) {
    setMessage("");
    setError("");

    if (
      nextStatus === "rejected" &&
      !window.confirm(
        `Reject the teacher application for ${teacherName(application)}?`,
      )
    ) {
      return;
    }

    try {
      const updatedUsers = updateAdminTeacherStatus(
        application.email,
        nextStatus,
      );
      const manager = window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";
      appendAdminActivityRecord({
        id: `teacher-${application.email}-${application.email.length}-${nextStatus}`,
        timestamp: new Date().toISOString(),
        actor: manager,
        action: nextStatus === "approved" ? "approved" : "rejected",
        category: "teacher-applications",
        entityType: "Teacher Application",
        entityId: application.email,
        targetName: teacherName(application),
        description: nextStatus === "approved"
          ? "Teacher application approved"
          : "Teacher application rejected",
        result: "Success",
      });
      setApplications(getAdminTeachers(updatedUsers));
      setSelectedApplication(null);
      setMessage(
        nextStatus === "approved"
          ? "Teacher application approved."
          : "Teacher application rejected.",
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "The teacher application could not be updated.",
      );
    }
  }

  function renderDetails(application) {
    const fields = [
      ["Teacher name", application.name],
      ["Email", application.email],
      [
        "Subject or specialization",
        firstValue(application, [
          "subject",
          "specialization",
          "teachingSpecialization",
          "teachingSubject",
        ]),
      ],
      [
        "Qualification",
        firstValue(application, [
          "qualification",
          "highestQualification",
          "education",
        ]),
      ],
      [
        "Experience",
        firstValue(application, [
          "experience",
          "yearsOfExperience",
          "teachingExperience",
        ]),
      ],
      [
        "Application date",
        formatApplicationDate(
          application.applicationDate ??
            application.appliedAt ??
            application.createdAt,
        ),
      ],
      ["Current status", applicationStatus(application)],
      ...DETAIL_FIELDS.filter(([key]) =>
        Object.hasOwn(application, key),
      ).map(([key, label]) => [
        label,
        firstValue(application, [key]) || "Not provided",
      ]),
    ];

    return fields.map(([label, value], index) => (
      <div
        className="edc-admin-detail-field"
        key={`${label}-${index}`}
      >
        <dt>{label}</dt>
        <dd>
          {typeof value === "string" || typeof value === "number"
            ? String(value).trim() || "Not provided"
            : "Not provided"}
        </dd>
      </div>
    ));
  }

  return (
    <section className="edc-admin-teacher-applications">
      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">
            Search teacher applications
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or subject"
          />
        </label>

        <div className="edc-admin-application-filters" aria-label="Filter applications">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                `edc-admin-filter-button${
                  statusFilter === filter.id
                    ? " edc-admin-filter-button-active"
                    : ""
                }`
              }
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="edc-admin-feedback edc-admin-feedback-success" role="status">
          <Check size={16} aria-hidden="true" />
          {message}
        </p>
      )}
      {error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          <Info size={16} aria-hidden="true" />
          {error}
        </p>
      )}

      {applications.length === 0 ? (
        <div className="edc-admin-applications-empty">
          <span className="edc-admin-applications-empty-icon" aria-hidden="true">
            <UsersRound size={23} />
          </span>
          <h3>No teacher applications</h3>
          <p>Teacher accounts registered in this browser will appear here.</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="edc-admin-applications-empty edc-admin-applications-empty-compact">
          <Search size={21} aria-hidden="true" />
          <h3>No matching applications</h3>
          <p>Try another search term or select a different status filter.</p>
        </div>
      ) : (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table">
            <thead>
              <tr>
                <th scope="col">Teacher</th>
                <th scope="col">Subject</th>
                <th scope="col">Qualification</th>
                <th scope="col">Experience</th>
                <th scope="col">Applied</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => {
                const pending = normalizedStatus(application) === "pending";
                const subject = firstValue(application, [
                  "subject",
                  "specialization",
                  "teachingSpecialization",
                  "teachingSubject",
                ]);
                const qualification = firstValue(application, [
                  "qualification",
                  "highestQualification",
                  "education",
                ]);
                const experience = firstValue(application, [
                  "experience",
                  "yearsOfExperience",
                  "teachingExperience",
                ]);

                return (
                  <tr key={application.email.toLowerCase()}>
                    <td>
                      <strong>{teacherName(application)}</strong>
                      <span>{application.email}</span>
                    </td>
                    <td>{subject || "Not provided"}</td>
                    <td>{qualification || "Not provided"}</td>
                    <td>{experience || "Not provided"}</td>
                    <td>
                      {formatApplicationDate(
                        application.applicationDate ??
                          application.appliedAt ??
                          application.createdAt,
                      )}
                    </td>
                    <td>
                      <span
                        className={`edc-admin-status-badge ${statusClass(application)}`}
                      >
                        {applicationStatus(application)}
                      </span>
                    </td>
                    <td>
                      <div className="edc-admin-application-actions">
                        <button
                          className="edc-admin-action-button"
                          type="button"
                          onClick={() => {
                            setMessage("");
                            setError("");
                            setSelectedApplication(application);
                          }}
                        >
                          <Eye size={15} aria-hidden="true" />
                          View Details
                        </button>
                        {pending && (
                          <>
                            <button
                              className="edc-admin-action-button edc-admin-action-approve"
                              type="button"
                              onClick={() =>
                                changeApplicationStatus(application, "approved")
                              }
                            >
                              <Check size={15} aria-hidden="true" />
                              Approve
                            </button>
                            <button
                              className="edc-admin-action-button edc-admin-action-reject"
                              type="button"
                              onClick={() =>
                                changeApplicationStatus(application, "rejected")
                              }
                            >
                              <XCircle size={15} aria-hidden="true" />
                              Reject
                            </button>
                            <button
                              className="edc-admin-action-button edc-admin-action-disabled"
                              type="button"
                              disabled
                              title="Requesting more information is coming soon."
                            >
                              Request info · Soon
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="edc-admin-applications-count" aria-live="polite">
        Showing {filteredApplications.length} of {applications.length} teacher
        {applications.length === 1 ? "" : "s"}
      </p>

      {selectedApplication && (
        <div
          className="edc-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <section
            className="edc-admin-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edc-admin-details-title"
          >
            <header className="edc-admin-details-header">
              <div>
                <span className="edc-admin-page-eyebrow">
                  TEACHER APPLICATION
                </span>
                <h3 id="edc-admin-details-title">Application details</h3>
              </div>
              <button
                className="edc-admin-modal-close"
                type="button"
                aria-label="Close application details"
                onClick={() => setSelectedApplication(null)}
              >
                <X size={19} />
              </button>
            </header>
            <dl className="edc-admin-details-list">
              {renderDetails(selectedApplication)}
            </dl>
            {normalizedStatus(selectedApplication) === "pending" && (
              <div className="edc-admin-details-actions">
                <button
                  className="edc-admin-action-button edc-admin-action-approve"
                  type="button"
                  onClick={() =>
                    changeApplicationStatus(selectedApplication, "approved")
                  }
                >
                  <Check size={15} aria-hidden="true" />
                  Approve
                </button>
                <button
                  className="edc-admin-action-button edc-admin-action-reject"
                  type="button"
                  onClick={() =>
                    changeApplicationStatus(selectedApplication, "rejected")
                  }
                >
                  <XCircle size={15} aria-hidden="true" />
                  Reject
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminTeacherApplications;
