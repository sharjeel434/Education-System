import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Receipt, WalletCards } from "lucide-react";
import { ADMIN_DATA_CHANGED_EVENT } from "./adminData";
import {
  FINANCIAL_DEMO_RECORDS,
  getAdminDemoTransactions,
  readAdminOperationsSettings,
  updateCommissionRate,
} from "./adminOperationsData";

const SECTIONS = [
  ["transactions", "Transactions"],
  ["payouts", "Tutor earnings & payouts"],
  ["licenses", "Subscriptions & licenses"],
  ["adjustments", "Refunds & chargebacks"],
  ["invoices", "Invoices & statements"],
  ["commission", "Commission configuration"],
];

function money(value) {
  return `PKR ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function AdminFinancialManagement({ email }) {
  const [settings, setSettings] = useState(readAdminOperationsSettings);
  const [transactionState, setTransactionState] = useState(getAdminDemoTransactions);
  const [section, setSection] = useState("transactions");
  const [commissionRate, setCommissionRate] = useState(() =>
    String(readAdminOperationsSettings().commissionRate),
  );
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);

  function refresh() {
    const next = readAdminOperationsSettings();
    setSettings(next);
    setCommissionRate(String(next.commissionRate));
    setTransactionState(getAdminDemoTransactions());
  }

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const transactions = transactionState.transactions.length
    ? transactionState.transactions
    : FINANCIAL_DEMO_RECORDS.transactions;
  const transactionSource = transactionState.transactions.length
    ? "Browser-local demo orders"
    : "Illustrative sample transactions";
  const gross = useMemo(
    () => transactions.reduce((total, item) => total + Number(item.amount || 0), 0),
    [transactions],
  );

  const datasets = {
    transactions,
    payouts: FINANCIAL_DEMO_RECORDS.payouts,
    licenses: FINANCIAL_DEMO_RECORDS.licenses,
    adjustments: FINANCIAL_DEMO_RECORDS.adjustments,
    invoices: FINANCIAL_DEMO_RECORDS.invoices,
  };
  const currentRecords = datasets[section] || [];
  const summaries = [
    { id: "transactions", label: "Demo transactions", value: transactions.length, icon: Receipt },
    { id: "payouts", label: "Sample payouts", value: FINANCIAL_DEMO_RECORDS.payouts.length, icon: WalletCards },
    { id: "licenses", label: "Sample subscriptions / licenses", value: FINANCIAL_DEMO_RECORDS.licenses.length, icon: FileText },
    { id: "adjustments", label: "Sample refunds / chargebacks", value: FINANCIAL_DEMO_RECORDS.adjustments.length, icon: AlertTriangle },
  ];

  function saveCommission(event) {
    event.preventDefault();
    const nextRate = Number(commissionRate);
    if (!Number.isFinite(nextRate) || nextRate < 0 || nextRate > 50) {
      setFeedback({ type: "error", text: "Enter a demo commission rate from 0 to 50%." });
      return;
    }
    if (!window.confirm(`Review and save the demo commission rate: ${settings.commissionRate}% → ${nextRate}%? This will not affect actual payments.`)) {
      return;
    }
    try {
      updateCommissionRate(
        settings,
        nextRate,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setFeedback({ type: "success", text: `Demo commission configuration saved at ${nextRate}%. No transaction records were changed.` });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Commission configuration could not be saved.",
      });
    }
  }

  return (
    <section className="edc-admin-operations">
      <p className="edc-admin-security-note">
        Demo financial workspace only. Local course orders are browser demo checkouts, and sample payout, license, adjustment and invoice records are illustrative. No payments, refunds or payouts are processed. No card or payment credentials are stored.
      </p>
      {feedback && (
        <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.text}</p>
      )}
      {settings.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{settings.error}</p>}
      {transactionState.errors.length > 0 && (
        <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{transactionState.errors.join(" ")}</p>
      )}

      <div className="edc-admin-stat-grid">
        {summaries.map(({ id, label, value, icon: Icon }) => (
          <button type="button" className={`edc-admin-stat-card edc-admin-ops-card${section === id ? " edc-admin-ops-card-active" : ""}`} key={id} onClick={() => setSection(id)} aria-pressed={section === id}>
            <span className="edc-admin-stat-icon" aria-hidden="true"><Icon size={19} /></span><p>{label}</p><strong>{value}</strong>
          </button>
        ))}
        <button type="button" className="edc-admin-stat-card edc-admin-ops-card" onClick={() => setSection("transactions")}>
          <span className="edc-admin-stat-icon" aria-hidden="true"><WalletCards size={19} /></span><p>Gross demo volume</p><strong>{money(gross)}</strong>
        </button>
      </div>

      <div className="edc-admin-application-filters edc-admin-ops-tabs" aria-label="Financial sections">
        {SECTIONS.map(([id, label]) => (
          <button type="button" className={`edc-admin-filter-button${section === id ? " edc-admin-filter-button-active" : ""}`} key={id} onClick={() => setSection(id)} aria-pressed={section === id}>{label}</button>
        ))}
      </div>

      {section === "commission" ? (
        <article className="edc-admin-panel edc-admin-ops-panel">
          <div className="edc-admin-panel-heading"><div><h3>Demo commission configuration</h3><p>This setting is saved separately from financial history and is not connected to checkout or payout processing.</p></div></div>
          <form className="edc-admin-ops-form" onSubmit={saveCommission}>
            <label className="edc-admin-import-field" htmlFor="admin-demo-commission">Demo commission rate (%)<input id="admin-demo-commission" type="number" min="0" max="50" step="0.1" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} required /></label>
            <button type="submit" className="edc-admin-settings-save">Review &amp; save demo rate</button>
          </form>
          <p className="edc-admin-settings-note">Current saved rate: {settings.commissionRate}%. Updating it does not rewrite or recalculate historical transaction records.</p>
        </article>
      ) : currentRecords.length ? (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table">
            <thead>
              <tr>{Object.keys(currentRecords[0]).filter((key) => key !== "studentEmail").map((key) => <th key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}</th>)}<th>Details</th></tr>
            </thead>
            <tbody>{currentRecords.map((record) => (
              <tr key={record.id}>
                {Object.entries(record).filter(([key]) => key !== "studentEmail").map(([key, value]) => (
                  <td key={key}>{key === "amount" ? money(value) : String(value ?? "Not provided")}</td>
                ))}
                <td><button className="edc-admin-action-button" type="button" onClick={() => setSelected(record)}>View details</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="edc-admin-applications-empty"><h3>No financial records available</h3><p>Demo transaction, payout, license, refund, chargeback and invoice records are shown where available.</p></div>
      )}

      {section === "transactions" && <p className="edc-admin-settings-note">Source: {transactionSource}. All order amounts are demo values and do not represent actual settlement.</p>}

      {selected && (
        <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="edc-admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="admin-finance-detail">
            <header className="edc-admin-details-header"><div><span className="edc-admin-page-eyebrow">FINANCIAL DEMO RECORD</span><h3 id="admin-finance-detail">{selected.id}</h3></div><button type="button" className="edc-admin-modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button></header>
            <dl className="edc-admin-details-list">{Object.entries(selected).map(([key, value]) => <div className="edc-admin-detail-field" key={key}><dt>{key}</dt><dd>{key === "amount" ? money(value) : String(value ?? "Not provided")}</dd></div>)}</dl>
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminFinancialManagement;
