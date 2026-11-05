import { useEffect, useMemo, useState } from "react";
import { getReviews, courseReviewKey, REVIEW_EVENT } from "../../utils/courseReviews";
import { ORDERS_EVENT } from "../../utils/studentCart";
import "./InstructorAnalytics.css";

const norm = v => String(v ?? "").trim().toLowerCase();
const number = v => Math.max(0, Number(v) || 0);
const formatCurrency = v => `PKR ${number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function collect(email, courses) {
  const byCourse = new Map(courses.map(course => [String(course.id), {
    ...course, enrollments: new Set(), sales: 0, revenue: 0, salesRecords: [], ratings: [], reviews: 0, reviewItems: [],
  }]));
  const seenOrders = new Set();
  const orderPurchases = new Set();
  const legacyPaidEnrollments = [];
  // Browser-local demo records, not server-side platform data.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    if (!key.startsWith("educonnect.student.")) continue;
    if (key.endsWith(".enrollments")) {
      const student = key.slice("educonnect.student.".length, -".enrollments".length);
      const rows = readJson(key, []);
      if (!Array.isArray(rows)) continue;
      rows.forEach(row => {
        if (norm(row.teacherEmail) !== norm(email)) return;
        const course = byCourse.get(String(row.id));
        if (!course) return;
        course.enrollments.add(student);
        legacyPaidEnrollments.push({ student, row, course });
      });
    }
    if (key.endsWith(".orders")) {
      const student = key.slice("educonnect.student.".length, -".orders".length);
      const orders = readJson(key, []);
      if (!Array.isArray(orders)) continue;
      orders.forEach(order => {
        const orderId = `${student}:${order.id || order.purchasedAt}`;
        if (seenOrders.has(orderId)) return;
        seenOrders.add(orderId);
        if (!/completed/i.test(String(order.status || ""))) return;
        (Array.isArray(order.items) ? order.items : []).forEach(item => {
          if (norm(item.teacherEmail) !== norm(email)) return;
          const row = byCourse.get(String(item.id));
          if (!row) return;
          orderPurchases.add(`${student}:${String(item.id)}`);
          row.sales += 1;
          row.revenue += number(item.price);
          row.salesRecords.push({
            id: `${orderId}:${String(item.id)}`,
            student: order.studentEmail || student,
            course: item.title || row.title,
            purchasedAt: order.purchasedAt || "",
            amount: number(item.price),
            status: order.status,
          });
          const month = String(order.purchasedAt || "").slice(0, 7);
          if (/^\d{4}-\d{2}$/.test(month)) {
            row.monthly ??= {};
            row.monthly[month] = (row.monthly[month] || 0) + number(item.price);
          }
        });
      });
    }
  }
  // Earlier demo checkouts saved paid enrollments but did not create orders.
  // Recover those purchases unless a completed order already represents them.
  legacyPaidEnrollments.forEach(({ student, row, course }) => {
    const purchaseKey = `${student}:${String(row.id)}`;
    if (orderPurchases.has(purchaseKey) || number(row.price) <= 0 || !row.enrolledAt) return;
    orderPurchases.add(purchaseKey);
    course.sales += 1;
    course.revenue += number(row.price);
    course.salesRecords.push({
      id: `legacy:${purchaseKey}`,
      student,
      course: row.title || course.title,
      purchasedAt: row.enrolledAt,
      amount: number(row.price),
      status: "Completed",
    });
    const month = String(row.enrolledAt).slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) {
      course.monthly ??= {};
      course.monthly[month] = (course.monthly[month] || 0) + number(row.price);
    }
  });
  const reviews = getReviews();
  for (const row of byCourse.values()) {
    const key = courseReviewKey({ ...row, teacherEmail: email });
    const ownReviews = reviews.filter(r => r.courseKey === key);
    row.reviewItems = ownReviews;
    row.ratings = ownReviews.map(r => number(r.rating)).filter(n => n >= 1 && n <= 5);
    row.reviews = ownReviews.length;
  }
  return [...byCourse.values()].map(({ enrollments, ...row }) => ({
    ...row, students: enrollments.size, studentEmails: [...enrollments],
    rating: row.ratings.length ? row.ratings.reduce((a,b)=>a+b,0)/row.ratings.length : 0,
  }));
}
const csvEscape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
export default function InstructorAnalytics({ email, courses = [] }) {
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState("");
  useEffect(() => {
    const update = () => setRevision(n => n + 1);
    window.addEventListener("storage", update);
    window.addEventListener(REVIEW_EVENT, update);
    window.addEventListener(ORDERS_EVENT, update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(REVIEW_EVENT, update);
      window.removeEventListener(ORDERS_EVENT, update);
      window.removeEventListener("focus", update);
    };
  }, []);
  const data = useMemo(() => collect(email, courses), [email, courses, revision]);
  const totals = data.reduce((a,c) => ({
    students: a.students + c.students, sales: a.sales + c.sales,
    revenue: a.revenue + c.revenue, reviews: a.reviews + c.reviews,
    weighted: a.weighted + c.rating * c.ratings.length, ratingCount: a.ratingCount + c.ratings.length
  }), { students:0, sales:0, revenue:0, reviews:0, weighted:0, ratingCount:0 });
  const monthly = {};
  data.forEach(c => Object.entries(c.monthly || {}).forEach(([month,value]) => { monthly[month] = (monthly[month] || 0) + value; }));
  const months = Array.from({length:6}, (_,i) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return { key, label:d.toLocaleDateString(undefined,{month:"short"}), value:monthly[key] || 0 };
  });
  const max = Math.max(1, ...months.map(m=>m.value));
  const salesRecords = data.flatMap(course => course.salesRecords || []).sort((a,b) => String(b.purchasedAt).localeCompare(String(a.purchasedAt)));
  const exportCsv = () => {
    const rows = [
      ["Course","Status","Students (browser-local)","Demo Sales","Demo Gross PKR","Reviews","Avg Rating"],
      ...data.map(c => [c.title,c.status || "Draft",c.students,c.sales,c.revenue.toFixed(2),c.reviews,c.rating.toFixed(2)])
    ];
    const csv = "\uFEFF" + rows.map(row=>row.map(csvEscape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
    const link = document.createElement("a");
    link.href=url; link.download="educonnect-instructor-analytics.csv"; link.click();
    URL.revokeObjectURL(url);
  };
  const detailTitles = { courses: "My Courses", enrollments: "Course Enrollments", sales: "Demo Sales", gross: "Demo Gross Sales", rating: "Average Rating", reviews: "Reviews" };
  if (detail) return <div className="edc-instructor-analytics edc-ia-detail-page">
    <section className="edc-ia-panel">
      <button className="edc-ia-back" type="button" onClick={() => setDetail("")}>← Back to Learning Analytics &amp; Sales</button>
      <h2>{detailTitles[detail]}</h2>
      {detail === "courses" && <div className="edc-ia-detail-list">{data.length ? data.map(c => <article key={String(c.id)}><strong>{c.title || "Untitled Course"}</strong><span>{c.status || "Draft"} · {c.students} students · {c.sales} sales</span><small>Gross sales: {formatCurrency(c.revenue)}</small></article>) : <p>No courses yet.</p>}</div>}
      {detail === "enrollments" && <div className="edc-ia-detail-list">{data.length ? data.map(c => <article key={String(c.id)}><strong>{c.title || "Untitled Course"} <span className="edc-ia-count">{c.students}</span></strong><small>{c.studentEmails.length ? c.studentEmails.join(", ") : "No enrolled students"}</small></article>) : <p>No courses yet.</p>}</div>}
      {detail === "sales" && <><h3>{totals.sales} demo sales</h3><div className="edc-ia-table-wrap"><table><thead><tr><th>Course</th><th>Student</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{salesRecords.length ? salesRecords.map(s => <tr key={s.id}><td>{s.course}</td><td>{s.student}</td><td>{s.purchasedAt ? new Date(s.purchasedAt).toLocaleDateString() : "—"}</td><td>{s.status}</td><td>{formatCurrency(s.amount)}</td></tr>) : <tr><td colSpan={5}>No demo sales yet.</td></tr>}</tbody></table></div></>}
      {detail === "gross" && <><h3>Total gross sales: {formatCurrency(totals.revenue)}</h3><div className="edc-ia-detail-list">{months.map(m => <article key={m.key}><strong>{new Date(`${m.key}-02`).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><span>{formatCurrency(m.value)}</span></article>)}</div><h3 className="edc-ia-subheading">By course</h3><div className="edc-ia-detail-list">{data.map(c => <article key={String(c.id)}><strong>{c.title || "Untitled Course"}</strong><span>{formatCurrency(c.revenue)}</span></article>)}</div></>}
      {detail === "rating" && <><p>Overall average: <strong>{totals.ratingCount ? (totals.weighted / totals.ratingCount).toFixed(1) : "—"}</strong> from {totals.ratingCount} ratings</p><div className="edc-ia-detail-list">{data.map(c => <article key={String(c.id)}><strong>{c.title || "Untitled Course"}</strong><span>{c.ratings.length ? `${c.rating.toFixed(1)} / 5 (${c.ratings.length} ratings)` : "No ratings yet"}</span></article>)}</div></>}
      {detail === "reviews" && <div className="edc-ia-detail-list">{data.flatMap(c => c.reviewItems.map((r,i) => ({...r, courseTitle:c.title || "Untitled Course", key:`${c.id}-${r.id || i}`}))).length ? data.flatMap(c => c.reviewItems.map((r,i) => ({...r, courseTitle:c.title || "Untitled Course", key:`${c.id}-${r.id || i}`}))).map(r => <article key={r.key}><strong>{r.courseTitle} · {r.rating}/5</strong><span>{r.studentName || r.studentEmail || "Student"}{r.updatedAt ? ` · ${new Date(r.updatedAt).toLocaleDateString()}` : ""}</span><p>{r.comment || r.review || "No written comment."}</p></article>) : <p>No reviews yet.</p>}</div>}
    </section>
  </div>;
  return <div className="edc-instructor-analytics">
    <header className="edc-ia-head"><span>INSTRUCTOR INSIGHTS</span><h2>Course Analytics & Demo Earnings</h2>
      <p>Based only on demo records saved in this browser. No real payments, payouts or platform-wide reporting.</p>
      <button type="button" onClick={exportCsv}>Export CSV Report</button></header>
    <div className="edc-ia-stats">
      <button type="button" onClick={() => setDetail("courses")}><small>My Courses</small><strong>{data.length}</strong><span>View details →</span></button>
      <button type="button" onClick={() => setDetail("enrollments")}><small>Course Enrollments</small><strong>{totals.students}</strong><span>View details →</span></button>
      <button type="button" onClick={() => setDetail("sales")}><small>Demo Sales</small><strong>{totals.sales}</strong><span>View details →</span></button>
      <button type="button" onClick={() => setDetail("gross")}><small>Demo Gross Sales</small><strong>{formatCurrency(totals.revenue)}</strong><span>View details →</span></button>
      <button type="button" onClick={() => setDetail("rating")}><small>Average Rating</small><strong>{totals.ratingCount ? (totals.weighted / totals.ratingCount).toFixed(1) : "—"}</strong><span>View details →</span></button>
      <button type="button" onClick={() => setDetail("reviews")}><small>Reviews</small><strong>{totals.reviews}</strong><span>View details →</span></button>
    </div>
    <section className="edc-ia-panel"><h3>Monthly demo gross sales</h3><p>Last 6 months · PKR · before deductions</p>
      <div className="edc-ia-chart">{months.map(m=><div className="edc-ia-month" key={m.key}>
        <small>{formatCurrency(m.value)}</small><div className="edc-ia-bar-wrap"><div style={{height:`${m.value ? Math.max(4,m.value/max*100):0}%`}}/></div><small>{m.label}</small>
      </div>)}</div></section>
    <section className="edc-ia-panel"><h3>Course Performance</h3>
      <div className="edc-ia-table-wrap"><table><thead><tr><th>Course</th><th>Status</th><th>Students</th><th>Sales</th><th>Demo Gross (PKR)</th><th>Rating</th></tr></thead>
      <tbody>{data.length ? data.map(c=><tr key={String(c.id)}><td>{c.title || "Untitled Course"}</td><td>{c.status || "Draft"}</td><td>{c.students}</td><td>{c.sales}</td><td>{formatCurrency(c.revenue)}</td><td>{c.ratings.length ? `${c.rating.toFixed(1)} (${c.reviews})` : "No ratings"}</td></tr>) :
      <tr><td colSpan={6}>No instructor courses yet.</td></tr>}</tbody></table></div></section>
    <section className="edc-ia-panel"><h3>Top courses</h3>
      {data.length ? [...data].sort((a,b)=>b.students-a.students || b.sales-a.sales).slice(0,3).map((c,i)=>
        <div className="edc-ia-top" key={String(c.id)}><span>#{i+1}</span><strong>{c.title}</strong><small>{c.students} enrolled · {c.sales} demo sales</small></div>) : <p>No courses to rank yet.</p>}
    </section>
    <p className="edc-ia-foot">Enrollment counts are per course (a student in two courses counts twice). Demo checkout data from other devices or browsers is unavailable. Older enrollments without matching teacher IDs cannot be attributed. Existing Teacher Earnings sample figures are separate fictional examples.</p>
  </div>;
}
