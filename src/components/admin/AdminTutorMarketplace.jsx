import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Search,
  UsersRound,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  readAdminOperationsSettings,
  getAdminTutorBookings,
  getAdminTutorProfiles,
  updateAdminTutorBookingStatus,
  updateTutorReviewStatus,
} from "./adminOperationsData";
import {
  readAdminSupportRequestsState,
  updateAdminSupportRequestStatus,
} from "./adminData";

const SECTIONS = [
  ["tutors", "Tutor profiles"],
  ["bookings", "Bookings"],
  ["cases", "Complaints & disputes"],
];
const REVIEW_STATUSES = [
  "Pending Review",
  "Evidence Requested",
  "Reviewed (Not Verified)",
  "Rejected",
];
const BOOKING_STATUSES = ["Demo Request", "Cancelled", "No-show Recorded", "Reviewed"];

function AdminTutorMarketplace({ email }) {
  const [settings, setSettings] = useState(readAdminOperationsSettings);
  const [profiles, setProfiles] = useState(() =>
    getAdminTutorProfiles(readAdminOperationsSettings()),
  );
  const [bookingState, setBookingState] = useState(getAdminTutorBookings);
  const [requestState, setRequestState] = useState(readAdminSupportRequestsState);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("tutors");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  function refresh() {
    const nextSettings = readAdminOperationsSettings();
    setSettings(nextSettings);
    setProfiles(getAdminTutorProfiles(nextSettings));
    setBookingState(getAdminTutorBookings());
    setRequestState(readAdminSupportRequestsState());
  }

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const cases = useMemo(
    () =>
      requestState.records.filter((request) => {
        const searchable = [
          request.subject,
          request.description,
          request.requesterName,
          request.requesterEmail,
        ]
          .filter((value) => typeof value === "string")
          .join(" ");
        return request.category === "Moderation & Appeal" || /\btutor\b/i.test(searchable);
      }),
    [requestState.records],
  );

  const visibleProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles.filter((profile) =>
      [profile.name, profile.email, profile.subject, profile.qualification]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [profiles, search]);
  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookingState.records.filter((booking) =>
      [
        booking.tutorName,
        booking.tutorSubject,
        booking.studentEmail,
        booking.slot,
        booking.status,
        booking.note,
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [bookingState.records, search]);
  const visibleCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((request) =>
      [
        request.subject,
        request.description,
        request.requesterName,
        request.requesterEmail,
        request.category,
        request.status,
      ]
        .filter((value) => typeof value === "string")
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [cases, search]);

  function recordActivity(profile, status) {
    try {
      updateTutorReviewStatus(
        settings,
        profile.id,
        status,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setFeedback({ type: "success", text: `Review status updated to ${status}.` });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Tutor review could not be saved.",
      });
    }
  }

  function updateBooking(booking, status) {
    try {
      updateAdminTutorBookingStatus(
        booking,
        status,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setSelected(null);
      setFeedback({
        type: "success",
        text: `Demo booking marked ${status}. No tutor or student was notified.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Booking status could not be updated.",
      });
    }
  }

  function updateCase(request, status) {
    try {
      updateAdminSupportRequestStatus(
        request.id,
        status,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setSelected(null);
      setFeedback({ type: "success", text: `Shared request status updated to ${status}.` });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Request status could not be updated.",
      });
    }
  }

  const counts = [
    { id: "tutors", label: "Tutor profiles", value: profiles.length, icon: UsersRound },
    { id: "bookings", label: "Demo bookings", value: bookingState.records.length, icon: CalendarDays },
    { id: "cases", label: "Related support records", value: cases.length, icon: AlertTriangle },
  ];

  return (
    <section className="edc-admin-operations">
      <p className="edc-admin-security-note">
        Tutor profiles include the existing fictional Student demo catalog and any registered tutor profiles.
        Bookings are read from existing browser-local Student records. No real appointments or notifications are created.
      </p>
      {feedback && (
        <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.text}
        </p>
      )}
      {settings.error && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          {settings.error}
        </p>
      )}
      {(bookingState.errors.length > 0 || requestState.error) && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
          {[...bookingState.errors, requestState.error].filter(Boolean).join(" ")}
        </p>
      )}

      <div className="edc-admin-stat-grid">
        {counts.map(({ id, label, value, icon: Icon }) => (
          <button
            className={`edc-admin-stat-card edc-admin-ops-card${section === id ? " edc-admin-ops-card-active" : ""}`}
            type="button"
            key={id}
            onClick={() => setSection(id)}
            aria-pressed={section === id}
          >
            <span className="edc-admin-stat-icon" aria-hidden="true"><Icon size={19} /></span>
            <p>{label}</p>
            <strong>{value}</strong>
          </button>
        ))}
      </div>

      <div className="edc-admin-applications-toolbar">
        <label className="edc-admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="edc-admin-visually-hidden">Search current tutor section</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles, bookings or requests" />
        </label>
        <div className="edc-admin-application-filters" aria-label="Tutor marketplace sections">
          {SECTIONS.map(([id, label]) => (
            <button
              type="button"
              className={`edc-admin-filter-button${section === id ? " edc-admin-filter-button-active" : ""}`}
              key={id}
              onClick={() => setSection(id)}
              aria-pressed={section === id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {section === "tutors" && (
        visibleProfiles.length ? (
          <div className="edc-admin-table-wrap">
            <table className="edc-admin-applications-table">
              <thead><tr><th>Tutor</th><th>Qualification</th><th>Availability</th><th>Source / status</th><th>Review</th></tr></thead>
              <tbody>
                {visibleProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td><strong>{profile.name}</strong><span>{profile.subject}{profile.email ? ` · ${profile.email}` : ""}</span></td>
                    <td>{profile.qualification}</td>
                    <td>{Array.isArray(profile.availability) ? profile.availability.join(", ") : profile.availability || "Not provided"}</td>
                    <td><span>{profile.type}</span><br /><span className="edc-admin-status-badge edc-admin-status-pending">{settings.tutorReviews[profile.id] || profile.status}</span></td>
                    <td>
                      <div className="edc-admin-application-actions">
                        <button className="edc-admin-action-button" type="button" onClick={() => setSelected(profile)}>View details</button>
                        <select
                          className="edc-admin-select"
                          aria-label={`Review ${profile.name}`}
                          value={settings.tutorReviews[profile.id] || profile.status}
                          onChange={(event) => recordActivity(profile, event.target.value)}
                        >
                          {REVIEW_STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="edc-admin-applications-empty"><h3>No matching tutor profiles</h3><p>Registered tutor profiles will appear when present in browser demo account data.</p></div>
      )}

      {section === "bookings" && (
        visibleBookings.length ? (
          <div className="edc-admin-table-wrap">
            <table className="edc-admin-applications-table">
              <thead><tr><th>Tutor</th><th>Student</th><th>Requested slot</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{visibleBookings.map((booking) => (
                <tr key={`${booking.studentEmail}:${booking.id}`}>
                  <td><strong>{booking.tutorName}</strong><span>{booking.tutorSubject}</span></td>
                  <td>{booking.studentEmail}</td><td>{booking.slot || "Not provided"}</td>
                  <td>{booking.status || "Demo Request"}</td>
                  <td><button className="edc-admin-action-button" type="button" onClick={() => setSelected(booking)}>View details</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="edc-admin-applications-empty"><h3>No demo bookings found</h3><p>Existing Student demo booking requests are shown here when present in browser storage.</p></div>
      )}

      {section === "cases" && (
        visibleCases.length ? (
          <div className="edc-admin-table-wrap">
            <table className="edc-admin-applications-table">
              <thead><tr><th>Request</th><th>Requester</th><th>Category</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>{visibleCases.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.subject}</strong><span>#{request.id}</span></td>
                  <td>{request.requesterName}<span>{request.requesterEmail}</span></td>
                  <td>{request.category}</td><td>{request.status}</td>
                  <td><button className="edc-admin-action-button" type="button" onClick={() => setSelected(request)}>View details</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="edc-admin-applications-empty"><h3>No related support records found</h3><p>Existing Moderation & Appeal requests and support records mentioning tutors will appear here. Appeals share the existing category and are not separated by this data model.</p></div>
      )}

      {selected && (
        <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="edc-admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="admin-tutor-detail-title">
            <header className="edc-admin-details-header">
              <div><span className="edc-admin-page-eyebrow">TUTOR MARKETPLACE DEMO</span><h3 id="admin-tutor-detail-title">{selected.name || selected.tutorName || selected.subject}</h3></div>
              <button type="button" className="edc-admin-modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            </header>
            <dl className="edc-admin-details-list">
              {Object.entries({
                Subject: selected.subject || selected.tutorSubject,
                Email: selected.email || selected.studentEmail,
                Qualification: selected.qualification,
                Experience: selected.experience,
                Availability: Array.isArray(selected.availability) ? selected.availability.join(", ") : selected.availability,
                Rating: selected.rating ? `${selected.rating} (sample)` : undefined,
                Booking: selected.slot,
                Status: selected.status,
                Description: selected.about || selected.description,
                Note: selected.note,
              }).filter(([, value]) => value).map(([label, value]) => (
                <div className="edc-admin-detail-field" key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            {selected.tutorName && (
              <div className="edc-admin-details-actions">
                {BOOKING_STATUSES.map((status) => (
                  <button className="edc-admin-action-button" key={status} type="button" disabled={selected.status === status} onClick={() => updateBooking(selected, status)}>
                    Mark {status}
                  </button>
                ))}
              </div>
            )}
            {selected.category && (
              <div className="edc-admin-details-actions">
                {["Open", "In Progress", "Resolved", "Closed"].map((status) => (
                  <button className="edc-admin-action-button" key={status} type="button" disabled={selected.status === status} onClick={() => updateCase(selected, status)}>
                    Mark {status}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminTutorMarketplace;
