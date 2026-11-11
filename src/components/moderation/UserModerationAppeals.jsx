import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, HelpCircle, LifeBuoy, Paperclip, RotateCcw, Send, ShieldAlert, X } from "lucide-react";
import { ADMIN_DATA_CHANGED_EVENT, MODERATION_APPEAL_STATUSES, SUPPORT_FAQ_CATEGORIES, SUPPORT_REQUEST_CATEGORIES, SUPPORT_REQUEST_PRIORITIES, addAdminSupportResponse, createAdminSupportRequest, getAdminHelpFaqs, readAdminSupportRequestsState, updateAdminSupportRequestStatus } from "../admin/adminData";
import { getModerationReportsState, MODERATION_REPORTS_EVENT } from "../../utils/moderationReports";
import "./UserModerationAppeals.css";

const priorities = ["Low", "Medium", "High", "Urgent"];

export default function UserModerationAppeals({ email, name, role }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const [requests, setRequests] = useState(() => readAdminSupportRequestsState().records);
  const [reports, setReports] = useState(() => getModerationReportsState().records);
  const [subject, setSubject] = useState("");
  const [reportId, setReportId] = useState("");
  const [appealType, setAppealType] = useState("Moderation Decision Appeal");
  const [relatedRecordId, setRelatedRecordId] = useState("");
  const [originalDecision, setOriginalDecision] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [evidenceInputKey, setEvidenceInputKey] = useState(0);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshRequests = () => setRequests(readAdminSupportRequestsState().records);
    const refreshReports = () => setReports(getModerationReportsState().records);
    const refreshAll = () => { refreshRequests(); refreshReports(); };
    window.addEventListener("storage", refreshAll);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRequests);
    window.addEventListener(MODERATION_REPORTS_EVENT, refreshReports);
    return () => {
      window.removeEventListener("storage", refreshAll);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refreshRequests);
      window.removeEventListener(MODERATION_REPORTS_EVENT, refreshReports);
    };
  }, []);

  const ownAppeals = useMemo(() => requests
    .filter((item) => Boolean(normalizedEmail) && item.category === "Moderation & Appeal" && String(item.requesterEmail || "").trim().toLowerCase() === normalizedEmail && (!item.requesterRole || item.requesterRole === role))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [normalizedEmail, requests, role]);
  const visibleCases = useMemo(() => reports.filter((item) => {
    if (!normalizedEmail) return false;
    const submittedByMe = String(item.reporterEmail || "").trim().toLowerCase() === normalizedEmail;
    const aboutMyAccountOrContent = role === "Teacher" && String(item.targetOwnerEmail || "").trim().toLowerCase() === normalizedEmail;
    const hasAdminAction = (item.history || []).some((entry) => !["Report submitted", "Appeal linked"].includes(entry.action));
    return submittedByMe || (aboutMyAccountOrContent && hasAdminAction);
  }).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)), [normalizedEmail, reports, role]);

  function startAppeal(item) {
    setReportId(item.id);
    setRelatedRecordId(item.id);
    setAppealType("Moderation Decision Appeal");
    setSubject(`Appeal: ${item.targetTitle}`.slice(0, 160));
    const adminActions = (item.history || []).filter((entry) => !["Report submitted", "Appeal linked"].includes(entry.action));
    setOriginalDecision(adminActions.at(-1)?.action || "");
    setDescription("");
    setFeedback("");
    setError("");
    document.querySelector(".edc-user-appeals-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setIsSubmitting(true);
    try {
      const savedEvidence = await readAttachment(evidence);
      createAdminSupportRequest({
        subject,
        description,
        category: "Moderation & Appeal",
        priority,
        requesterName: name || role || "User",
        requesterEmail: normalizedEmail,
        requesterRole: role || "User",
        requesterId: normalizedEmail,
        actor: normalizedEmail || role || "User",
        moderationReportId: reportId.trim(),
        appealType,
        relatedRecordId: relatedRecordId.trim() || reportId.trim(),
        originalDecision,
        attachment: savedEvidence,
      });
      setSubject("");
      setReportId("");
      setRelatedRecordId("");
      setOriginalDecision("");
      setEvidence(null);
      setEvidenceInputKey((current) => current + 1);
      setDescription("");
      setPriority("Medium");
      setAppealType("Moderation Decision Appeal");
      setFeedback("Your appeal was submitted to Admin.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your appeal could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function replyToAppeal(appeal) {
    const message = String(replyDrafts[appeal.id] || "").trim();
    if (!message) return;
    setError("");
    try {
      addAdminSupportResponse(appeal.id, { message, author: name || role || "User", actor: normalizedEmail, authorRole: role, requesterEmail: normalizedEmail });
      setReplyDrafts((current) => ({ ...current, [appeal.id]: "" }));
      setRequests(readAdminSupportRequestsState().records);
      setFeedback("Your appeal reply was sent to Admin.");
    } catch (replyError) { setError(replyError instanceof Error ? replyError.message : "Your reply could not be sent."); }
  }

  return <section className="edc-user-appeals-page">
    <header className="edc-user-appeals-heading">
      <span><ShieldAlert size={20} /></span>
      <div><span className="edc-user-appeals-eyebrow">SUPPORT & GOVERNANCE</span><h2>Moderation & Appeals</h2>
        <p>Ask Admin to review a moderation decision, account restriction, or reported item. Add the report ID if you have one.</p></div>
    </header>

    <div className="edc-user-appeals-grid">
      <form className="edc-user-appeals-card" onSubmit={submit}>
        <h3>Submit an appeal</h3>
        <label>Subject<input required minLength={3} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Briefly describe your appeal" /></label>
        <label>Appeal type<select value={appealType} onChange={(event) => setAppealType(event.target.value)}>{["Course Rejection Appeal", "PDF/eBook Rejection Appeal", "Teacher Application Rejection Appeal", "Account Restriction Appeal", "Moderation Decision Appeal"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Related record ID (optional)<input maxLength={120} value={relatedRecordId} onChange={(event) => setRelatedRecordId(event.target.value)} placeholder="Course, book, account or decision ID" /></label>
        <label>Original decision<input required minLength={3} maxLength={240} value={originalDecision} onChange={(event) => setOriginalDecision(event.target.value)} placeholder="For example, Course rejected" /></label>
        <label>Moderation report ID (optional)<input maxLength={80} value={reportId} onChange={(event) => setReportId(event.target.value)} placeholder="For example, MOD-…" /></label>
        <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}>{priorities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Appeal reason and explanation<textarea required minLength={5} maxLength={5000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain the decision and why you are requesting a review." /></label>
        <label>Optional evidence (max 2 MB)<input key={evidenceInputKey} type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={(event) => setEvidence(event.target.files?.[0] || null)} />{evidence && <small>{evidence.name}</small>}</label>
        {error && <p className="edc-user-appeals-feedback error" role="alert"><AlertCircle size={15} /> {error}</p>}
        {feedback && <p className="edc-user-appeals-feedback success" role="status">{feedback}</p>}
        <button type="submit" disabled={isSubmitting}><Send size={15} /> {isSubmitting ? "Submitting…" : "Submit Appeal"}</button>
      </form>

      <section className="edc-user-appeals-card" aria-label="Your reports, outcomes, and appeals">
        <h3>Your reports & outcomes</h3>
        {visibleCases.length ? <div className="edc-user-appeals-list edc-user-case-list">{visibleCases.map((item) => {
          const adminActions = (item.history || []).filter((entry) => !["Report submitted", "Appeal linked"].includes(entry.action));
          const lastAction = adminActions.at(-1);
          return <article className="edc-user-appeal-item" key={item.id}>
            <div className="edc-user-appeal-item-heading"><strong>{item.targetTitle}</strong><span data-status={String(item.status || "Pending").toLowerCase().replaceAll(" ", "-")}>{item.status || "Pending"}</span></div>
            <small>{item.id} · {item.targetType}</small>
            <small>Reported {item.createdAt ? new Date(item.createdAt).toLocaleString() : "date unavailable"}{lastAction ? ` · Latest action: ${lastAction.action}` : ""}</small>
            {lastAction && <button className="edc-user-appeal-link" type="button" onClick={() => startAppeal(item)}>Appeal / add context</button>}
          </article>;
        })}</div> : <p className="edc-user-appeals-empty">Your submitted reports and moderation outcomes will appear here.</p>}

        <h3 className="edc-user-appeals-subheading">Your appeals</h3>
        {ownAppeals.length ? <div className="edc-user-appeals-list">{ownAppeals.map((appeal) => {
          const publicResponses = (Array.isArray(appeal.responses) ? appeal.responses : []).filter((response) => response.type !== "internal_note");
          return <article className="edc-user-appeal-item" key={appeal.id}>
            <div className="edc-user-appeal-item-heading"><strong>{appeal.subject}</strong><span data-status={String(appeal.status || "Submitted").toLowerCase().replaceAll(" ", "-")}>{MODERATION_APPEAL_STATUSES.includes(appeal.status) ? appeal.status : "Submitted"}</span></div>
            <small>Appeal ID: {appeal.id} · {appeal.appealType || "Moderation Decision Appeal"}</small>
            {appeal.relatedRecordId && <small>Related record: {appeal.relatedRecordTitle || appeal.relatedRecordId} · {appeal.relatedRecordId}</small>}
            {appeal.originalDecision && <small>Original decision: {appeal.originalDecision}</small>}
            <p>{appeal.description}</p>
            {appeal.moderationReportId && <small>Report ID: {appeal.moderationReportId}</small>}
            <small>Submitted {appeal.createdAt ? new Date(appeal.createdAt).toLocaleString() : "date unavailable"} · {appeal.priority || "Medium"} priority</small>
            {publicResponses.map((response) => <div className="edc-user-appeal-response" key={response.id}><strong>{response.author || "Admin"}</strong><p>{response.message}</p><small>{response.createdAt ? new Date(response.createdAt).toLocaleString() : ""}</small></div>)}
            {appeal.decisionReason && <p className="edc-user-appeal-decision"><strong>Admin decision reason:</strong> {appeal.decisionReason}</p>}
            {appeal.status !== "Closed" && <form className="edc-user-appeal-reply" onSubmit={(event) => { event.preventDefault(); replyToAppeal(appeal); }}><textarea aria-label={`Reply to appeal ${appeal.id}`} rows={2} maxLength={5000} value={replyDrafts[appeal.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [appeal.id]: event.target.value }))} placeholder="Reply to Admin or provide requested information" /><button type="submit" disabled={!String(replyDrafts[appeal.id] || "").trim()}><Send size={14} /> Send Reply</button></form>}
          </article>;
        })}</div> : <p className="edc-user-appeals-empty">You have not submitted a moderation appeal yet.</p>}
      </section>
    </div>
    <p className="edc-user-appeals-note">Appeals are private support records. Admin decisions and internal review notes remain in the Admin workspace.</p>
  </section>;
}

const ticketCategories = SUPPORT_REQUEST_CATEGORIES.filter((category) => category !== "Moderation & Appeal");

function readAttachment(file) {
  if (!file) return Promise.resolve(null);
  if (file.size > 2 * 1024 * 1024) return Promise.reject(new Error("Attachment must be 2 MB or smaller."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: String(reader.result || "") });
    reader.onerror = () => reject(new Error("The attachment could not be read."));
    reader.readAsDataURL(file);
  });
}

export function UserSupportCenter({ email, name, role }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const [requests, setRequests] = useState(() => readAdminSupportRequestsState().records);
  const [ticketFaqs, setTicketFaqs] = useState(() => getAdminHelpFaqs({ publishedOnly: true }));
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Technical Issue");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [relatedRecord, setRelatedRecord] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState("all");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const refresh = () => {
      setRequests(readAdminSupportRequestsState().records);
      setTicketFaqs(getAdminHelpFaqs({ publishedOnly: true }));
    };
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const ownTickets = useMemo(() => requests
    .filter((item) => Boolean(normalizedEmail) && item.category !== "Moderation & Appeal" && String(item.requesterEmail || "").trim().toLowerCase() === normalizedEmail && (!item.requesterRole || item.requesterRole === role))
    .sort((first, second) => new Date(second.updatedAt || second.createdAt) - new Date(first.updatedAt || first.createdAt)), [normalizedEmail, requests, role]);
  const visibleFaqs = ticketFaqs.filter((faq) => (faqCategory === "all" || faq.category === faqCategory) && `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase().includes(faqSearch.trim().toLowerCase()));

  async function submitTicket(event) {
    event.preventDefault();
    setError("");
    setFeedback("");
    try {
      const savedAttachment = await readAttachment(attachment);
      createAdminSupportRequest({
        subject,
        description,
        category,
        priority,
        requesterName: name || role || "User",
        requesterEmail: normalizedEmail,
        requesterRole: role || "User",
        requesterId: normalizedEmail,
        relatedRecordId: relatedRecord.trim(),
        relatedRecordTitle: relatedRecord.trim(),
        attachment: savedAttachment,
        actor: normalizedEmail || role || "User",
      });
      setSubject("");
      setDescription("");
      setRelatedRecord("");
      setAttachment(null);
      setFileInputKey((current) => current + 1);
      setFeedback("Your support ticket was submitted. You can follow replies and status below.");
      setRequests(readAdminSupportRequestsState().records);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your support request could not be submitted.");
    }
  }

  function replyToTicket(ticket) {
    const message = String(replyDrafts[ticket.id] || "").trim();
    if (!message) return;
    setError("");
    try {
      addAdminSupportResponse(ticket.id, { message, author: name || role || "User", actor: normalizedEmail, authorRole: role, requesterEmail: normalizedEmail });
      setReplyDrafts((current) => ({ ...current, [ticket.id]: "" }));
      setRequests(readAdminSupportRequestsState().records);
      setFeedback("Your reply was sent.");
    } catch (replyError) { setError(replyError instanceof Error ? replyError.message : "Your reply could not be sent."); }
  }

  function updateTicket(ticket, status) {
    if (!window.confirm(`${status === "Closed" ? "Close" : "Reopen"} ticket ${ticket.id}?`)) return;
    setError("");
    try {
      updateAdminSupportRequestStatus(ticket.id, status, normalizedEmail, "", { actorRole: role, requesterEmail: normalizedEmail });
      setRequests(readAdminSupportRequestsState().records);
      setFeedback(status === "Closed" ? "Ticket closed. You can reopen it if the issue returns." : "Ticket reopened.");
    } catch (statusError) { setError(statusError instanceof Error ? statusError.message : "Ticket status could not be changed."); }
  }

  return <section className="edc-user-support-center">
    <header className="edc-user-support-heading"><span><LifeBuoy size={21} /></span><div><small>SUPPORT &amp; HELP CENTER</small><h2>Help &amp; Support</h2><p>Submit a request, track your tickets, and reply to Admin in the same conversation.</p></div></header>
    {error && <p className="edc-user-support-feedback error" role="alert"><AlertCircle size={15} /> {error}</p>}
    {feedback && <p className="edc-user-support-feedback success" role="status">{feedback}</p>}
    <div className="edc-user-support-grid">
      <form className="edc-user-support-card" onSubmit={submitTicket}>
        <h3>New Support Ticket</h3>
        <label>Problem title<input required minLength={3} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Briefly describe the problem" /></label>
        <div className="edc-user-support-fields"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{ticketCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}>{SUPPORT_REQUEST_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <label>Related course / PDF / order (optional)<input maxLength={180} value={relatedRecord} onChange={(event) => setRelatedRecord(event.target.value)} placeholder="Name or record ID" /></label>
        <label>Description<textarea required minLength={5} maxLength={5000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain what happened and what you need help with." /></label>
        <label className="edc-user-support-attachment"><Paperclip size={15} /> Optional attachment (max 2 MB)<input key={fileInputKey} type="file" accept="image/*,.pdf,.txt,.doc,.docx" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />{attachment && <small>{attachment.name}</small>}</label>
        <button type="submit"><Send size={15} /> Submit Request</button>
        <small className="edc-user-support-storage-note">This browser demo stores the ticket locally. Do not attach sensitive personal or payment information.</small>
      </form>
      <section className="edc-user-support-card edc-user-support-faq-card">
        <div className="edc-user-support-card-heading"><div><h3>Help Center &amp; FAQs</h3><p>Find answers before sending a request.</p></div><HelpCircle size={19} /></div>
        <label className="edc-user-support-faq-search">Search FAQs<input type="search" value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Search a question" /></label>
        <label className="edc-user-support-faq-search">Category<select value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)}><option value="all">All categories</option>{SUPPORT_FAQ_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {visibleFaqs.length ? visibleFaqs.map((faq) => <details key={faq.id}><summary>{faq.question}</summary><small>{faq.category}</small><p>{faq.answer}</p></details>) : <p className="edc-user-support-empty">No published FAQ matches this search.</p>}
      </section>
    </div>
    <section className="edc-user-support-card edc-user-support-my-tickets"><div className="edc-user-support-card-heading"><div><h3>My Tickets</h3><p>{ownTickets.length} saved ticket{ownTickets.length === 1 ? "" : "s"}</p></div><Clock3 size={19} /></div>
      {ownTickets.length ? ownTickets.map((ticket) => <article className="edc-user-support-ticket" key={ticket.id}>
        <header><div><strong>{ticket.subject}</strong><small>{ticket.id} · {ticket.category} · {ticket.priority} priority</small></div><span data-status={String(ticket.status).toLowerCase().replaceAll(" ", "-")}>{ticket.status}</span></header>
        <p>{ticket.description}</p><small>Submitted {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "date unavailable"}{ticket.assignedStaff ? ` · Assigned to ${ticket.assignedStaff}` : ""}</small>
        {ticket.relatedRecordId && <small>Related: {ticket.relatedRecordTitle || ticket.relatedRecordId}</small>}
        {ticket.attachment?.dataUrl && <a href={ticket.attachment.dataUrl} download={ticket.attachment.name} target="_blank" rel="noreferrer">Attachment: {ticket.attachment.name}</a>}
        <div className="edc-user-support-conversation">{(Array.isArray(ticket.responses) ? ticket.responses : []).filter((response) => response.type !== "internal_note").map((response) => <div key={response.id}><strong>{response.author || "Support"} <small>· {response.authorRole || "Support"}</small></strong><p>{response.message}</p><time>{response.createdAt ? new Date(response.createdAt).toLocaleString() : ""}</time></div>)}</div>
        <div className="edc-user-support-ticket-actions">{ticket.status === "Resolved" && <button type="button" className="secondary" onClick={() => updateTicket(ticket, "Closed")}><X size={14} /> Close Ticket</button>}{ticket.status === "Closed" && <button type="button" className="secondary" onClick={() => updateTicket(ticket, "Open")}><RotateCcw size={14} /> Reopen Ticket</button>}</div>
        {ticket.status !== "Closed" && <form className="edc-user-support-reply" onSubmit={(event) => { event.preventDefault(); replyToTicket(ticket); }}><textarea aria-label={`Reply to ticket ${ticket.id}`} rows={2} maxLength={5000} value={replyDrafts[ticket.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Write a reply to Admin" /><button type="submit" disabled={!String(replyDrafts[ticket.id] || "").trim()}><Send size={14} /> Send Reply</button></form>}
      </article>) : <p className="edc-user-support-empty">You have not submitted a support ticket yet.</p>}
    </section>
    <p className="edc-user-support-privacy">You can only see tickets linked to your signed-in email. Private messages and attachments are stored in this browser demo; production access control requires an authenticated backend.</p>
  </section>;
}
