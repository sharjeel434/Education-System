import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { ADMIN_DATA_CHANGED_EVENT } from "./adminData";
import { getAdminSavedOrderItems } from "./adminOperationsData";
import {
  ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT,
  getAdminPlatformSettings,
} from "./adminPlatformSettings";
import { createCsvContent, downloadCsv } from "./adminCsvUtils";

const SECTIONS = [
  ["overview", "Overview"],
  ["transactions", "Order Records"],
  ["payouts", "Payouts"],
  ["subscriptions", "Subscriptions"],
  ["refunds", "Refunds & Adjustments"],
  ["invoices", "Invoices"],
  ["commission", "Commission Settings"],
];
const PAGE_SIZE = 8;

function money(value) {
  return Number.isFinite(value)
    ? `PKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "Not provided";
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function statusClass(value) {
  const status = String(value || "").toLowerCase();
  if (["completed", "paid", "success"].includes(status)) return "edc-admin-status-approved";
  if (["pending", "processing"].includes(status)) return "edc-admin-status-pending";
  if (["cancelled", "failed", "rejected"].includes(status)) return "edc-admin-status-rejected";
  return "edc-admin-status-unknown";
}

function monthLabel(value) {
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function AdminFinancialManagement() {
  const [orderState, setOrderState] = useState(getAdminSavedOrderItems);
  const [platform, setPlatform] = useState(getAdminPlatformSettings);
  const [section, setSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [dateReferenceTime, setDateReferenceTime] = useState(() => Date.now());

  function refresh() {
    setOrderState(getAdminSavedOrderItems());
    setPlatform(getAdminPlatformSettings());
    setDateReferenceTime(Date.now());
  }

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    window.addEventListener(ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT, refresh);
    window.addEventListener("educonnect:student-data-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
      window.removeEventListener(ADMIN_PLATFORM_SETTINGS_CHANGED_EVENT, refresh);
      window.removeEventListener("educonnect:student-data-changed", refresh);
    };
  }, []);

  const records = orderState.records;
  const knownAmounts = records.filter((record) => Number.isFinite(record.amount));
  const orderIds = new Set(records.map((record) => record.orderId || record.id));
  const totalOrderValue = knownAmounts.reduce((total, record) => total + record.amount, 0);
  const currentMonth = new Date(dateReferenceTime).toISOString().slice(0, 7);
  const currentMonthRecords = knownAmounts.filter((record) => String(record.date || "").slice(0, 7) === currentMonth);
  const thisMonthValue = currentMonthRecords.reduce((total, record) => total + record.amount, 0);

  const filteredRecords = useMemo(() => {
    const query = search.trim().replace(/\s+/g, " ").toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      const searchable = [
        record.id,
        record.orderId,
        record.description,
        record.studentEmail,
        record.status,
        record.date,
      ]
        .filter((value) => value !== undefined && value !== null)
        .map(String)
        .join(" ")
        .toLowerCase();
      return !query || searchable.includes(query);
    }).sort((a, b) => {
      if (sort === "oldest") return new Date(a.date) - new Date(b.date);
      if (sort === "amount") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      return new Date(b.date) - new Date(a.date);
    });
  }, [records, search, sort, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const recentRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, PAGE_SIZE);

  const monthlyValues = useMemo(() => {
    const values = new Map();
    records.forEach((record) => {
      if (!Number.isFinite(record.amount)) return;
      const date = new Date(record.date);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 7);
      values.set(key, (values.get(key) || 0) + record.amount);
    });
    return [...values.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-12)
      .map(([month, amount]) => ({ month, label: monthLabel(month), amount }));
  }, [records]);

  const statusCounts = useMemo(() => {
    const counts = new Map();
    records.forEach((record) => counts.set(record.status, (counts.get(record.status) || 0) + 1));
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [records]);
  const hasRecordErrors = orderState.errors.length > 0;
  const statusColors = ["#7412bf", "#ffba08", "#17a84b", "#ee3e5a", "#8d7ba0"];
  let segmentProgress = 0;
  const donutStops = statusCounts.map((status, index) => {
    const end = segmentProgress + (status.count / Math.max(1, records.length)) * 100;
    const stop = `${statusColors[index % statusColors.length]} ${segmentProgress}% ${end}%`;
    segmentProgress = end;
    return stop;
  }).join(", ");
  const donutBackground = statusCounts.length && !hasRecordErrors
    ? `conic-gradient(${donutStops})`
    : records.length && hasRecordErrors
      ? "conic-gradient(#9383a5 0 100%)"
      : "conic-gradient(#e9def4 0 100%)";
  const statusOptions = [...new Set(records.map((record) => record.status))].sort();

  function exportReport(rows = filteredRecords) {
    try {
      const columns = [
        { header: "Order ID", getValue: (record) => record.orderId },
        { header: "Order Item ID", getValue: (record) => record.id },
        { header: "Course", getValue: (record) => record.description },
        { header: "Student", getValue: (record) => record.studentEmail },
        { header: "Listed Price (Demo)", getValue: (record) => record.amount ?? "" },
        { header: "Order Status", getValue: (record) => record.status },
        { header: "Date", getValue: (record) => record.date },
      ];
      downloadCsv("educonnect-saved-demo-orders.csv", createCsvContent(rows, columns));
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "The saved order report could not be exported.",
      });
    }
  }

  const chartMax = Math.max(1, ...monthlyValues.map((item) => item.amount));
  const chartPoints = monthlyValues.map((item, index) => ({
    ...item,
    x: monthlyValues.length === 1 ? 330 : 34 + (index / (monthlyValues.length - 1)) * 592,
    y: 145 - (item.amount / chartMax) * 112,
  }));
  const chartPath = chartPoints.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const errors = [...orderState.errors, platform.error].filter(Boolean);

  return (
    <section className="edc-admin-finance-reference">
      <header className="edc-admin-finance-heading">
        <div>
          <span className="edc-admin-page-eyebrow">FINANCE &amp; OPERATIONS</span>
          <h2><WalletCards aria-hidden="true" />Financial Management</h2>
          <p>Review saved course checkout records and current platform finance settings.</p>
        </div>
        <div className="edc-admin-finance-heading-actions">
          <button type="button" className="edc-admin-action-button" onClick={() => exportReport()} disabled={hasRecordErrors || !filteredRecords.length}>
            <Download size={15} aria-hidden="true" />Export Report
          </button>
          <Link className="edc-admin-button-primary" to="/admin/settings"><Settings size={15} aria-hidden="true" />Platform Settings</Link>
        </div>
      </header>

      <p className="edc-admin-finance-note">
        Orders are browser-local demo checkouts. Their listed prices are not payments, settled revenue, payouts, or profit. This page does not process payments.
      </p>
      {feedback && (
        <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.text}</p>
      )}
      {errors.length > 0 && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{[...new Set(errors)].join(" ")}</p>
      )}

      <div className="edc-admin-finance-stats" aria-label="Saved order summaries">
        {[
          { label: "Saved Orders", value: hasRecordErrors ? "—" : orderIds.size.toLocaleString(), section: "transactions", icon: Receipt, color: "purple" },
          { label: "Order Value (Demo)", value: hasRecordErrors || !knownAmounts.length ? "—" : money(totalOrderValue), section: "transactions", icon: WalletCards, color: "orange" },
          { label: "This Month (Demo)", value: hasRecordErrors || !currentMonthRecords.length ? "—" : money(thisMonthValue), section: "transactions", icon: CalendarDays, color: "green" },
          { label: "Payouts", value: "Not tracked", section: "payouts", icon: ShieldAlert, color: "red" },
          { label: "Refunds / Chargebacks", value: "Not tracked", section: "refunds", icon: ShieldAlert, color: "violet" },
        ].map(({ label, value, icon: Icon, color, section: targetSection }) => (
          <button
            className={`edc-admin-finance-stat edc-admin-finance-stat-${color} edc-admin-metric-card edc-admin-metric-${color}${section === targetSection ? " is-active" : ""}`}
            key={label}
            type="button"
            aria-pressed={section === targetSection}
            onClick={() => setSection(targetSection)}
          >
            <span><Icon size={20} aria-hidden="true" /></span>
            <div><p>{label}</p><strong>{value}</strong></div>
          </button>
        ))}
      </div>

      <nav className="edc-admin-finance-tabs" aria-label="Financial sections">
        {SECTIONS.map(([id, label]) => (
          <button type="button" aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""} key={id} onClick={() => { setSection(id); setPage(1); }}>
            {label}{id === "transactions" && <span>({hasRecordErrors ? "—" : records.length.toLocaleString()})</span>}
          </button>
        ))}
      </nav>

      {section === "overview" ? (
        <div className="edc-admin-finance-workspace">
          <main className="edc-admin-finance-main">
            <section className="edc-admin-finance-card edc-admin-finance-chart-card">
              <header><h3><BarChart3 size={17} aria-hidden="true" />Monthly Saved Order Value</h3><span>PKR · Demo checkout data</span></header>
              {monthlyValues.length && !hasRecordErrors ? (
                <div className="edc-admin-finance-chart-wrap">
                  <svg className="edc-admin-finance-chart" viewBox="0 0 650 190" role="img" aria-label="Monthly totals calculated from saved browser-local demo course orders">
                    {[0, 1, 2, 3].map((line) => {
                      const y = 28 + line * 38;
                      return <g key={line}><line x1="34" y1={y} x2="626" y2={y} /><text x="0" y={y + 3}>{money(chartMax * (3 - line) / 3).replace("PKR ", "")}</text></g>;
                    })}
                    <path className="edc-admin-finance-chart-area" d={`${chartPath} L ${chartPoints[chartPoints.length - 1].x} 150 L ${chartPoints[0].x} 150 Z`} />
                    <path className="edc-admin-finance-chart-line" d={chartPath} />
                    {chartPoints.map((point) => (
                      <g key={point.month}>
                        <circle cx={point.x} cy={point.y} r="3.5" />
                        <text className="month" x={point.x} y="173" textAnchor="middle">{point.label}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="edc-admin-finance-empty-inline"><BarChart3 size={21} /><p>{hasRecordErrors ? "Order records could not all be read, so a complete chart is unavailable." : "No dated order items with saved prices are available for the chart."}</p></div>
              )}
            </section>

            <section className="edc-admin-finance-card edc-admin-finance-recent-card">
              <header>
                <h3><Receipt size={17} aria-hidden="true" />Recent Saved Order Items</h3>
                <button type="button" onClick={() => { setSection("transactions"); setPage(1); }}>View All Orders <ArrowRight size={14} /></button>
              </header>
              {hasRecordErrors ? <EmptyState text="Some saved order records could not be read; totals and recent items are unavailable." /> : recentRecords.length ? <OrderTable rows={recentRecords} onOpen={setSelected} compact /> : <EmptyState text="No saved demo order items were found." />}
            </section>
          </main>

          <aside className="edc-admin-finance-sidebar">
            <section className="edc-admin-finance-card">
              <header><h3><CheckCircle2 size={17} aria-hidden="true" />Saved Order Status</h3></header>
              <div className="edc-admin-finance-status-overview">
                <div className="edc-admin-finance-donut" style={{ background: donutBackground }} role="img" aria-label={`${hasRecordErrors ? "Unknown" : records.length} saved order items by order status`}>
                  <span><strong>{hasRecordErrors ? "—" : records.length.toLocaleString()}</strong><small>Items</small></span>
                </div>
                <div className="edc-admin-finance-legend">
                  {hasRecordErrors ? (
                    <div><i style={{ backgroundColor: "#9383a5" }} /><span>Status counts unavailable</span><strong>—</strong></div>
                  ) : statusCounts.length ? statusCounts.map((item, index) => (
                    <div key={item.label}><i style={{ backgroundColor: statusColors[index % statusColors.length] }} /><span>{item.label}</span><strong>{hasRecordErrors ? "—" : item.count.toLocaleString()}</strong></div>
                  )) : <p>{hasRecordErrors ? "Order status counts unavailable." : "No saved order statuses."}</p>}
                </div>
              </div>
              <p className="edc-admin-finance-side-note">Status counts describe saved demo order items, not payment settlement.</p>
            </section>

            <section className="edc-admin-finance-card">
              <header><h3><WalletCards size={17} aria-hidden="true" />Finance Records</h3></header>
              <dl className="edc-admin-finance-record-list">
                <div><dt>Saved course order items</dt><dd>{hasRecordErrors ? "—" : records.length.toLocaleString()}</dd></div>
                <div><dt>Payouts</dt><dd>Not tracked</dd></div>
                <div><dt>Refunds / chargebacks</dt><dd>Not tracked</dd></div>
                <div><dt>Subscriptions / licenses</dt><dd>Not tracked</dd></div>
                <div><dt>Invoices</dt><dd>Not tracked</dd></div>
              </dl>
              <p className="edc-admin-finance-side-note">No sample finance records are added when these data sources are empty.</p>
            </section>

            <section className="edc-admin-finance-card">
              <header><h3><Settings size={17} aria-hidden="true" />Quick Actions</h3></header>
              <div className="edc-admin-finance-quick-actions">
                <button type="button" disabled={hasRecordErrors || !filteredRecords.length} onClick={() => exportReport()}><Download size={14} />Export Saved Orders</button>
                <button type="button" onClick={() => setSection("commission")}><Settings size={14} />Commission Setting</button>
                <Link to="/admin/courses"><FileText size={14} />Course Records</Link>
                <Link to="/admin/settings"><Settings size={14} />Platform Settings</Link>
              </div>
            </section>
          </aside>
        </div>
      ) : section === "transactions" ? (
        <section className="edc-admin-finance-card">
          <header><h3><Receipt size={17} aria-hidden="true" />Saved Demo Course Order Items</h3><span>{hasRecordErrors ? "Order item count unavailable" : `${records.length.toLocaleString()} items · browser-local records`}</span></header>
          <div className="edc-admin-finance-filters">
            <label className="edc-admin-search">
              <Search size={16} aria-hidden="true" />
              <span className="edc-admin-visually-hidden">Search saved orders</span>
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search order, course, student, or status..." />
            </label>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by order status">
              <option value="all">All statuses</option>
              {statusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
            </select>
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort order records">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest listed price</option>
            </select>
            <button type="button" className="edc-admin-action-button" onClick={() => { setSearch(""); setStatusFilter("all"); setSort("newest"); setPage(1); }}>Clear Filters</button>
          </div>
          {hasRecordErrors ? (
            <EmptyState text="Saved browser order records could not be read." />
          ) : pageRecords.length ? (
            <OrderTable rows={pageRecords} onOpen={setSelected} />
          ) : (
            <EmptyState text={search || statusFilter !== "all" ? "No saved order items match these filters." : "No saved demo order items were found."} />
          )}
          <div className="edc-admin-finance-pagination">
            <span>{hasRecordErrors ? "Order item totals unavailable." : `Showing ${filteredRecords.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–${Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} of ${filteredRecords.length}`}</span>
            <div><button type="button" aria-label="Previous page" disabled={hasRecordErrors || currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft size={14} /></button><span>{hasRecordErrors ? "Page — of —" : `Page ${currentPage} of ${pageCount}`}</span><button type="button" aria-label="Next page" disabled={hasRecordErrors || currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ArrowRight size={14} /></button></div>
          </div>
        </section>
      ) : section === "commission" ? (
        <section className="edc-admin-finance-card edc-admin-finance-commission">
          <header><h3><Settings size={17} aria-hidden="true" />Platform Commission Setting</h3></header>
          {platform.error ? (
            <EmptyState text="Saved platform settings are unavailable. The commission setting cannot be shown reliably." />
          ) : (
            <>
              <dl className="edc-admin-finance-commission-details">
                <div><dt>Configured commission rate</dt><dd>{Number(platform.marketplace.commissionRate).toLocaleString()}%</dd></div>
                <div><dt>Demo checkout mode</dt><dd>{platform.marketplace.demoCheckoutMode ? "Enabled" : "Disabled"}</dd></div>
                <div><dt>Paid content allowed</dt><dd>{platform.marketplace.allowPaidContent ? "Enabled" : "Disabled"}</dd></div>
              </dl>
              <p>This is saved platform configuration only. It is not applied to checkout, does not calculate payouts, and does not change order history.</p>
              <Link className="edc-admin-button-primary" to="/admin/settings"><Settings size={15} />Edit Platform Settings</Link>
            </>
          )}
        </section>
      ) : (
        <section className="edc-admin-finance-card edc-admin-finance-empty-section">
          <EmptyState
            text={{
              payouts: "No payout records or payout-processing workflow are stored in this app.",
              subscriptions: "No subscription or license records are stored in this app.",
              refunds: "No refund or chargeback records are stored in this app.",
              invoices: "No invoice or statement records are stored in this app.",
            }[section] || "No saved finance records are available."}
          />
          <p>When a supported record source is added, this section can show its saved data. No example records have been inserted.</p>
        </section>
      )}

      {selected && (
        <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="edc-admin-details-modal edc-admin-finance-detail" role="dialog" aria-modal="true" aria-labelledby="admin-finance-detail">
            <header className="edc-admin-details-header">
              <div><span className="edc-admin-page-eyebrow">SAVED DEMO ORDER ITEM</span><h3 id="admin-finance-detail">{selected.description}</h3></div>
              <button type="button" className="edc-admin-modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            </header>
            <dl className="edc-admin-details-list">
              {Object.entries({
                "Order ID": selected.orderId,
                "Order item ID": selected.id,
                Student: selected.studentEmail,
                "Listed price (demo)": money(selected.amount),
                Status: selected.status,
                Date: formatDate(selected.date),
              }).map(([label, value]) => (
                <div className="edc-admin-detail-field" key={label}><dt>{label}</dt><dd>{String(value ?? "Not provided")}</dd></div>
              ))}
            </dl>
            <p className="edc-admin-finance-note">This saved checkout record does not confirm that money was transferred.</p>
          </section>
        </div>
      )}
    </section>
  );
}

function OrderTable({ rows, onOpen, compact = false }) {
  return (
    <div className="edc-admin-finance-table-wrap">
      <table className="edc-admin-finance-table">
        <thead><tr><th scope="col">Order ID</th><th scope="col">Course</th><th scope="col">Student</th><th scope="col">Listed Price</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead>
        <tbody>{rows.map((record) => (
          <tr key={record.id}>
            <td><span className="edc-admin-finance-order-id">{record.orderId || record.id}</span></td>
            <td><span className="edc-admin-finance-course"><span><FileText size={15} aria-hidden="true" /></span><strong>{record.description}</strong></span></td>
            <td>{record.studentEmail || "Not provided"}</td>
            <td>{money(record.amount)}</td>
            <td><span className="edc-admin-finance-date"><CalendarDays size={13} aria-hidden="true" />{formatDate(record.date)}</span></td>
            <td><span className={`edc-admin-status-badge ${statusClass(record.status)}`}>{record.status}</span></td>
            <td><button className="edc-admin-finance-view" type="button" onClick={() => onOpen(record)} aria-label={`View saved order item ${record.id}`} title="View details"><Eye size={15} aria-hidden="true" /></button></td>
          </tr>
        ))}</tbody>
      </table>
      {compact && <span className="edc-admin-visually-hidden">Showing recent saved order items.</span>}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="edc-admin-finance-empty-inline"><ShieldAlert size={20} aria-hidden="true" /><p>{text}</p></div>;
}

export default AdminFinancialManagement;
