import { useEffect, useState } from "react";
import { BookOpen, Pencil, Send, Trash2 } from "lucide-react";
import { BOOKS_CHANGED_EVENT, BOOKS_MAX_FILE_SIZE, createBookSystemId, deleteTeacherBook, getBookReviews, getTeacherBooks, saveBookFile, saveBookRecord, validateBookUpload } from "../../utils/books";
import "./books.css";

const blankForm = { title: "", description: "", author: "", subject: "", educationLevel: "", classOrProgram: "", pages: "", isFree: true, price: "", downloadAllowed: false };

export default function TeacherBooks({ email, profile }) {
  const [books, setBooks] = useState(() => getTeacherBooks(email));
  const [form, setForm] = useState(blankForm);
  const [pdf, setPdf] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [cover, setCover] = useState(null);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const refresh = () => setBooks(getTeacherBooks(email));
    window.addEventListener(BOOKS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(BOOKS_CHANGED_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, [email]);

  function reset() { setForm(blankForm); setPdf(null); setPreviewPdf(null); setCover(null); setEditing(null); }
  function editBook(book) {
    setEditing(book);
    setForm({ title: book.title || "", description: book.description || "", author: book.author || "", subject: book.subject || "", educationLevel: book.educationLevel || "", classOrProgram: book.classOrProgram || "", pages: book.pages || "", isFree: Boolean(book.isFree), price: book.price || "", downloadAllowed: Boolean(book.downloadAllowed) });
    setPdf(null); setPreviewPdf(null); setCover(null); setMessage(""); setError("");
  }

  async function save(event, submit = false) {
    event.preventDefault(); setError(""); setMessage("");
    if (saving) return;
    if (!String(form.title).trim()) { setError("Book title is required."); return; }
    if (!String(form.subject).trim() || !String(form.educationLevel).trim()) { setError("Subject and education level are required."); return; }
    const duplicate = books.find((book) => String(book.id) !== String(editing?.id || "") && String(book.title || "").trim().toLowerCase() === String(form.title).trim().toLowerCase() && String(book.subject || "").trim().toLowerCase() === String(form.subject).trim().toLowerCase());
    if (duplicate) { setError("A book with this title and subject already exists in your uploads."); return; }
    if (!editing && !pdf) { setError("Choose a PDF file before saving."); return; }
    if (pdf) {
      const validation = validateBookUpload(pdf, form.title, form.price, form.isFree);
      if (validation) { setError(validation); return; }
    } else if (!form.isFree && (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0)) { setError("Enter a valid price greater than Rs. 0."); return; }
    if (previewPdf && (previewPdf.type !== "application/pdf" || !/\.pdf$/i.test(previewPdf.name) || previewPdf.size > 5 * 1024 * 1024)) { setError("Preview must be a PDF file no larger than 5 MB."); return; }
    if (cover && (!/^image\/(jpeg|png|webp)$/.test(cover.type) || cover.size > 1024 * 1024)) { setError("Cover image must be JPG, PNG or WebP and 1 MB or smaller."); return; }
    const id = editing?.id || createBookSystemId("book");
    const pdfFileId = pdf ? `book-pdf:${String(email).toLowerCase()}:${id}:${createBookSystemId("revision")}` : editing.pdfFileId;
    const previewFileId = previewPdf ? `book-preview:${String(email).toLowerCase()}:${id}:${createBookSystemId("revision")}` : editing?.previewFileId || "";
    const coverFileId = cover ? `book-cover:${String(email).toLowerCase()}:${id}:${createBookSystemId("revision")}` : editing?.coverFileId || "";
    setSaving(true);
    try {
      if (pdf) await saveBookFile(pdfFileId, pdf);
      if (previewPdf) await saveBookFile(previewFileId, previewPdf);
      if (cover) await saveBookFile(coverFileId, cover);
      saveBookRecord({
        ...(editing || {}), id, teacherEmail: String(email).trim().toLowerCase(), teacherName: profile.name || String(email).split("@")[0],
        title: String(form.title).trim(), fileName: pdf?.name || editing?.fileName || "book.pdf", pdfFileIds: [...(editing?.pdfFileIds || (editing?.pdfFileId ? [editing.pdfFileId] : [])), ...(pdf && editing?.pdfFileId ? [editing.pdfFileId] : []), pdfFileId].filter(Boolean), previewFileId, previewFileIds: [...(editing?.previewFileIds || (editing?.previewFileId ? [editing.previewFileId] : [])), ...(previewPdf && editing?.previewFileId ? [editing.previewFileId] : []), previewFileId].filter(Boolean), previewFileName: previewPdf?.name || editing?.previewFileName || "", coverFileId, coverFileIds: [...(editing?.coverFileIds || (editing?.coverFileId ? [editing.coverFileId] : [])), ...(cover && editing?.coverFileId ? [editing.coverFileId] : []), coverFileId].filter(Boolean), description: String(form.description).trim(), author: String(form.author).trim() || profile.name || "",
        subject: String(form.subject).trim(), educationLevel: form.educationLevel, classOrProgram: String(form.classOrProgram).trim(), semester: "", pages: Math.max(0, Number(form.pages) || 0),
        isFree: Boolean(form.isFree), price: form.isFree ? 0 : Number(form.price), downloadAllowed: Boolean(form.downloadAllowed), pdfFileId,
        status: submit ? "Pending Approval" : "Draft", rejectionReason: "", updatedAt: new Date().toISOString(), createdAt: editing?.createdAt || new Date().toISOString(),
      });
      setMessage(submit ? "Submitted to Admin for approval." : "Draft saved."); reset();
    } catch (saveError) { setError(saveError.message || "Book could not be saved in this browser."); }
    finally { setSaving(false); }
  }

  function removeBook(book) {
    if (!window.confirm(`Delete “${book.title}”?`)) return;
    if (deleteTeacherBook(email, book.id)) { setMessage(book.status === "Published" ? "Removed from the public library. Existing buyer access is preserved in this browser." : "Book deleted."); if (editing?.id === book.id) reset(); }
  }

  return <div className="edc-tab-content">
    <section className="edc-panel"><h2>My PDF/eBooks</h2><p>Only PDF files are accepted. Maximum PDF size: {BOOKS_MAX_FILE_SIZE / 1024 / 1024} MB. New or edited books stay private until Admin approval.</p>
      {error && <p role="alert" className="edc-book-message edc-book-error">{error}</p>}{message && <p role="status" className="edc-book-message">{message}</p>}
      <form className="edc-book-form" onSubmit={(event) => save(event, false)}>
        <h3>{editing ? "Edit Book" : "Upload PDF/eBook"}</h3>
        <label>Book title *<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Description<textarea rows={3} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="edc-book-form-grid">
          <label>Author<input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></label>
          <label>Subject *<input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
          <label>Education level *<select required value={form.educationLevel} onChange={(event) => setForm({ ...form, educationLevel: event.target.value })}><option value="">Select</option>{["School", "College / Intermediate", "BS / Bachelor's", "Master's", "PhD", "Online / Interest"].map((level) => <option key={level}>{level}</option>)}</select></label>
          <label>Class / Program<input value={form.classOrProgram} onChange={(event) => setForm({ ...form, classOrProgram: event.target.value })} placeholder="Class 10, BS Computer Science" /></label>
          <label>PDF pages (optional)<input type="number" min="1" value={form.pages} onChange={(event) => setForm({ ...form, pages: event.target.value })} /></label>
          <label>PDF file {editing ? "(optional replacement)" : "*"}<input type="file" accept="application/pdf,.pdf" required={!editing} onChange={(event) => setPdf(event.target.files?.[0] || null)} /></label>
          <label>Preview PDF for paid books (optional, max 5 MB)<input type="file" accept="application/pdf,.pdf" onChange={(event) => setPreviewPdf(event.target.files?.[0] || null)} /></label>
          <label>Cover image (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] || null)} /></label>
          <label>Price type<select value={form.isFree ? "free" : "paid"} onChange={(event) => setForm({ ...form, isFree: event.target.value === "free", price: event.target.value === "free" ? "" : form.price })}><option value="free">Free</option><option value="paid">Paid</option></select></label>
          {!form.isFree && <label>Price (PKR) *<input type="number" min="1" step="1" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>}
        </div>
        <label className="edc-book-check"><input type="checkbox" checked={form.downloadAllowed} onChange={(event) => setForm({ ...form, downloadAllowed: event.target.checked })} /> Allow students to download after they have access</label>
        <div className="edc-book-actions"><button type="submit" disabled={saving}><BookOpen size={16} /> {saving ? "Saving..." : "Save as Draft"}</button><button type="button" disabled={saving} onClick={(event) => save(event, true)}><Send size={16} /> Submit for Admin Approval</button>{editing && <button type="button" className="edc-book-light" onClick={reset}>Cancel Edit</button>}</div>
      </form>
    </section>
    <section className="edc-panel"><h3>Your Books ({books.length})</h3>{books.length ? <div className="edc-book-list">{books.map((book) => <article key={book.id}>
      <div><strong>{book.title}</strong><p>{book.subject} · {book.educationLevel}{book.classOrProgram ? ` · ${book.classOrProgram}` : ""} · {book.isFree ? "Free" : `PKR ${Number(book.price).toLocaleString()}`} · {getBookReviews().filter((review) => String(review.bookId) === String(book.id) && !review.moderated).length} review(s)</p><span className={`edc-book-status edc-book-status-${String(book.status).toLowerCase().replaceAll(" ", "-")}`}>{book.status}</span>{book.rejectionReason && <p className="edc-book-error">Admin reason: {book.rejectionReason}</p>}</div>
      <div className="edc-book-actions"><button type="button" className="edc-book-light" onClick={() => editBook(book)}><Pencil size={15} /> Edit</button><button type="button" className="edc-book-light" onClick={() => removeBook(book)}><Trash2 size={15} /> Delete</button></div>
    </article>)}</div> : <p>You have not uploaded any PDFs yet.</p>}</section>
  </div>;
}
