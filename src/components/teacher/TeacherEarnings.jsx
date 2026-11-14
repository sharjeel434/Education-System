import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Download,
  Eye,
  Receipt,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { collectInstructorCourseAnalytics } from "../../utils/instructorAnalytics";
import { ORDERS_EVENT } from "../../utils/studentCart";
import "./TeacherEarnings.css";

const money = (value) =>
  `PKR ${Math.max(0, Number(value) || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;

const monthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function getMonths(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1),
    );
    return {
      key: monthKey(date),
      label: date.toLocaleDateString(undefined, {
        month: "short",
        timeZone: "UTC",
      }),
    };
  });
}

function dateLabel(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date not recorded";
}

function exportReport(courses) {
  const rows = [
    ["Course", "Enrolled students", "Recorded demo sales", "Gross recorded sales (PKR)"],
    ...courses.map((course) => [
      course.title || "Untitled course",
      course.students,
      course.sales,
      Number(course.revenue || 0).toFixed(2),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "teacher-recorded-demo-sales.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function RevenueChart({ months, values }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => ({
    x: 42 + (index * 540) / Math.max(1, values.length - 1),
    y: 22 + ((max - value) / max) * 142,
  }));
  const line = points.map(({ x, y }, index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${points[points.length - 1]?.x || 582},178 L${points[0]?.x || 42},178 Z`;

  return (
    <div className="edc-teacher-earnings-chart">
      <svg viewBox="0 0 600 210" role="img" aria-label="Recorded gross sales by month">
        <defs>
          <linearGradient id="edc-earnings-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7412c7" stopOpacity=".24" />
            <stop offset="100%" stopColor="#7412c7" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[22, 58, 94, 130, 166].map((y) => (
          <line
            key={y}
            x1="42"
            x2="582"
            y1={y}
            y2={y}
            className="edc-teacher-earnings-gridline"
          />
        ))}
        {points.length > 1 && <path d={area} fill="url(#edc-earnings-area)" />}
        {points.length > 1 && (
          <path d={line} className="edc-teacher-earnings-line" />
        )}
        {points.map(({ x, y }, index) => (
          <g key={months[index].key}>
            <circle cx={x} cy={y} r="4.5" className="edc-teacher-earnings-dot">
              <title>{`${months[index].label}: ${money(values[index])}`}</title>
            </circle>
            <text x={x} y="199" textAnchor="middle" className="edc-teacher-earnings-month">
              {months[index].label}
            </text>
          </g>
        ))}
      </svg>
      {!values.some((value) => value > 0) && (
        <p className="edc-teacher-earnings-chart-empty">
          No recorded sales in this period.
        </p>
      )}
    </div>
  );
}

export default function TeacherEarnings({ email, courses = [] }) {
  const [, setRevision] = useState(0);
  const [period, setPeriod] = useState(6);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState("");

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(ORDERS_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(ORDERS_EVENT, refresh);
    };
  }, []);

  const courseData = collectInstructorCourseAnalytics(email, courses);
  const sales = courseData
    .flatMap((course) =>
      (course.salesRecords || []).map((record) => ({
        ...record,
        courseId: String(course.id),
        course: record.course || course.title || "Untitled course",
      })),
    )
    .sort(
      (left, right) =>
        (Date.parse(right.purchasedAt || "") || 0) -
        (Date.parse(left.purchasedAt || "") || 0),
    );
  const months = useMemo(() => getMonths(period), [period]);
  const currentMonth = monthKey(new Date());
  const monthRecords = sales.filter(
    (sale) => String(sale.purchasedAt || "").slice(0, 7) === currentMonth,
  );
  const monthSales = monthRecords
    .reduce((total, sale) => total + (Number(sale.amount) || 0), 0);
  const grossSales = sales.reduce(
    (total, sale) => total + (Number(sale.amount) || 0),
    0,
  );
  const enrolledStudents = new Set(
    courseData.flatMap((course) => course.studentEmails || []),
  ).size;
  const totalCourseEnrollments = courseData.reduce(
    (total, course) => total + course.students,
    0,
  );
  const monthlySales = months.map(({ key }) =>
    sales
      .filter((sale) => String(sale.purchasedAt || "").slice(0, 7) === key)
      .reduce((total, sale) => total + (Number(sale.amount) || 0), 0),
  );
  const rankedCourses = [...courseData].sort(
    (left, right) => right.revenue - left.revenue || right.students - left.students,
  );
  const studentEnrollments = courseData.flatMap((course) =>
    (course.enrollmentRecords || []).map((student) => ({
      id: `${course.id}:${student.email}`,
      title: student.name || student.email,
      detail: `${course.title || "Untitled course"} · Enrolled ${dateLabel(student.enrolledAt)}`,
    })),
  );
  const summaryDetails = {
    gross: {
      title: "Gross Recorded Sales",
      description: "Saved demo sales summarized by your courses.",
      emptyMessage: "No course records are available yet.",
      items: rankedCourses.map((course) => ({
        id: String(course.id),
        title: course.title || "Untitled course",
        detail: `${course.sales} recorded sales · ${course.students} enrollments`,
        amount: money(course.revenue),
      })),
    },
    month: {
      title: "This Month",
      description: "Saved course sales dated in the current month.",
      emptyMessage: "No course sales are recorded for this month.",
      items: monthRecords.map((sale) => ({
        id: sale.id,
        title: sale.course,
        detail: `${dateLabel(sale.purchasedAt)} · ${sale.status || "Recorded demo sale"}`,
        amount: money(sale.amount),
      })),
    },
    sales: {
      title: "Recorded Sales",
      description: "Saved course checkout records from this browser.",
      emptyMessage: "No course sales have been recorded yet.",
      items: sales.map((sale) => ({
        id: sale.id,
        title: sale.course,
        detail: `${dateLabel(sale.purchasedAt)} · ${sale.status || "Recorded demo sale"}`,
        amount: money(sale.amount),
      })),
    },
    students: {
      title: "Enrolled Students",
      description: "Saved student enrollments by course. Students enrolled in multiple courses appear once per course.",
      emptyMessage: "No student enrollments are recorded yet.",
      items: studentEnrollments,
    },
  };
  const summaryDetail = summaryDetails[selectedSummary];
  const selectedCourseSales = selectedCourse
    ? sales.filter((sale) => sale.courseId === String(selectedCourse.id))
    : [];

  return (
    <main className="edc-teacher-earnings">
      <header className="edc-teacher-earnings-header">
        <div>
          <span className="edc-teacher-earnings-eyebrow">FINANCIAL OVERVIEW</span>
          <h1><WalletCards size={27} /> Teacher Earnings</h1>
          <p>Review saved course sales and enrollment activity.</p>
        </div>
        <button
          type="button"
          className="edc-teacher-earnings-download"
          onClick={() => exportReport(courseData)}
        >
          <Download size={17} /> Download Earnings Report
        </button>
      </header>

      <p className="edc-teacher-earnings-notice" role="note">
        <CircleAlert size={17} />
        <span>
          These figures come from demo checkout records saved in this browser. No real
          payments, balances, or payouts are processed.
        </span>
      </p>

      <section className="edc-teacher-earnings-stats" aria-label="Earnings summary">
        <button
          type="button"
          className="edc-teacher-earnings-stat purple"
          aria-label={`Gross recorded sales: ${money(grossSales)}. View course breakdown.`}
          onClick={() => setSelectedSummary("gross")}
        >
          <span><WalletCards size={22} /></span>
          <div><small>Gross Recorded Sales</small><strong>{money(grossSales)}</strong></div>
        </button>
        <button
          type="button"
          className="edc-teacher-earnings-stat gold"
          aria-label={`This month: ${money(monthSales)}. View this month's sales.`}
          onClick={() => setSelectedSummary("month")}
        >
          <span><CalendarDays size={22} /></span>
          <div><small>This Month</small><strong>{money(monthSales)}</strong></div>
        </button>
        <button
          type="button"
          className="edc-teacher-earnings-stat purple"
          aria-label={`Recorded sales: ${sales.length}. View sale records.`}
          onClick={() => setSelectedSummary("sales")}
        >
          <span><BookOpen size={22} /></span>
          <div><small>Recorded Sales</small><strong>{sales.length.toLocaleString()}</strong></div>
        </button>
        <button
          type="button"
          className="edc-teacher-earnings-stat gold"
          aria-label={`Enrolled students: ${enrolledStudents}. View student enrollments.`}
          onClick={() => setSelectedSummary("students")}
        >
          <span><UsersRound size={22} /></span>
          <div><small>Enrolled Students</small><strong>{enrolledStudents.toLocaleString()}</strong></div>
        </button>
      </section>

      <div className="edc-teacher-earnings-layout">
        <div className="edc-teacher-earnings-primary">
          <section className="edc-teacher-earnings-panel">
            <header className="edc-teacher-earnings-panel-heading">
              <div><h2>Earnings Overview</h2><p>Gross recorded demo sales · PKR</p></div>
              <label>
                <CalendarDays size={15} />
                <select
                  aria-label="Chart period"
                  value={period}
                  onChange={(event) => setPeriod(Number(event.target.value))}
                >
                  <option value={6}>Last 6 Months</option>
                  <option value={12}>Last 12 Months</option>
                </select>
              </label>
            </header>
            <RevenueChart months={months} values={monthlySales} />
          </section>

          <section className="edc-teacher-earnings-panel">
            <header className="edc-teacher-earnings-panel-heading">
              <div><h2><BookOpen size={18} /> Earnings by Course</h2><p>Actual course enrollments and saved sale records</p></div>
            </header>
            <div className="edc-teacher-earnings-table-wrap">
              <table className="edc-teacher-earnings-table">
                <thead><tr><th>#</th><th>Course</th><th>Students</th><th>Sales</th><th>Gross Sales</th><th>Details</th></tr></thead>
                <tbody>
                  {rankedCourses.length ? rankedCourses.map((course, index) => (
                    <tr key={String(course.id)}>
                      <td>{index + 1}</td>
                      <td className="edc-teacher-earnings-course-title">{course.title || "Untitled course"}</td>
                      <td>{course.students}</td>
                      <td>{course.sales}</td>
                      <td>{money(course.revenue)}</td>
                      <td>
                        <button
                          type="button"
                          className="edc-teacher-earnings-view"
                          aria-label={`View ${course.title || "course"} sales`}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="edc-teacher-earnings-empty-cell">No courses are saved for this teacher yet.</td></tr>
                  )}
                </tbody>
                <tfoot><tr><th colSpan={2}>Total</th><th>{totalCourseEnrollments}</th><th>{sales.length}</th><th>{money(grossSales)}</th><th /></tr></tfoot>
              </table>
            </div>
          </section>
        </div>

        <aside className="edc-teacher-earnings-secondary">
          <section className="edc-teacher-earnings-panel edc-teacher-payout-panel">
            <header className="edc-teacher-earnings-panel-heading">
              <h2><WalletCards size={18} /> Payout &amp; Balance</h2>
            </header>
            <div className="edc-teacher-payout-unavailable">
              <CircleAlert size={21} />
              <div><strong>Payouts unavailable</strong><p>This app does not have a payout or balance service.</p></div>
            </div>
            <button type="button" disabled title="Payout processing is not available">
              Request Payout
            </button>
          </section>

          <section className="edc-teacher-earnings-panel edc-teacher-recent-panel">
            <header className="edc-teacher-earnings-panel-heading">
              <div><h2><Receipt size={18} /> Recent Transactions</h2><p>Saved demo course sales</p></div>
              <span>{sales.length}</span>
            </header>
            {sales.length ? (
              <ul>
                {sales.slice(0, 6).map((sale) => (
                  <li key={sale.id}>
                    <span className="edc-teacher-earnings-transaction-icon"><ArrowDown size={17} /></span>
                    <div><strong>Course Sale — {sale.course}</strong><small>{dateLabel(sale.purchasedAt)} · Demo record</small></div>
                    <b>{money(sale.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="edc-teacher-earnings-recent-empty">No course sales have been recorded yet.</p>
            )}
          </section>
        </aside>
      </div>

      {(selectedCourse || summaryDetail) && (
        <div
          className="edc-teacher-earnings-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCourse(null);
              setSelectedSummary("");
            }
          }}
        >
          <section
            className="edc-teacher-earnings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edc-teacher-earnings-modal-title"
          >
            <header>
              <div>
                <span>{selectedCourse ? "COURSE SALES" : "SAVED RECORDS"}</span>
                <h2 id="edc-teacher-earnings-modal-title">
                  {selectedCourse
                    ? selectedCourse.title || "Untitled course"
                    : summaryDetail.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(null);
                  setSelectedSummary("");
                }}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </header>
            {selectedCourse ? (
              <>
                <p>{selectedCourse.students} saved enrollments · {selectedCourse.sales} recorded sales · {money(selectedCourse.revenue)} gross</p>
                {selectedCourseSales.length ? (
                  <ul>{selectedCourseSales.map((sale) => <li key={sale.id}><span>{dateLabel(sale.purchasedAt)} · {sale.status || "Recorded"}</span><strong>{money(sale.amount)}</strong></li>)}</ul>
                ) : (
                  <div className="edc-teacher-earnings-modal-empty">No saved sales for this course.</div>
                )}
              </>
            ) : (
              <>
                <p>{summaryDetail.description}</p>
                {summaryDetail.items.length ? (
                  <ul>
                    {summaryDetail.items.map((item) => (
                      <li key={item.id}>
                        <span><strong>{item.title}</strong><br />{item.detail}</span>
                        {item.amount && <strong>{item.amount}</strong>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="edc-teacher-earnings-modal-empty">{summaryDetail.emptyMessage}</div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
