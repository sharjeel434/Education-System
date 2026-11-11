const STORAGE_KEY = "educonnect.courseReviews.v1";
export const REVIEW_EVENT = "educonnect:reviews-changed";
export function getReviews(includeModerated = false) {
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(data) ? (includeModerated ? data : data.filter((review) => !review.moderated)) : []; }
  catch { return []; }
}
export function courseReviewKey(course) {
  return `${String(course.teacherEmail || "demo").trim().toLowerCase()}::${String(course.id)}`;
}
export function saveReview(review) {
  const existing = getReviews(true).find(r => r.courseKey === review.courseKey && r.studentEmail === review.studentEmail);
  const reviews = getReviews(true).filter(r => !(r.courseKey === review.courseKey && r.studentEmail === review.studentEmail));
  reviews.push(existing?.moderated ? { ...review, id: existing.id, moderated: true, moderationUpdatedAt: existing.moderationUpdatedAt } : review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(REVIEW_EVENT));
}

export function saveModeratedReview(targetId, moderated) {
  const reviews = getReviews(true);
  const next = reviews.map((review) => {
    const identity = String(review.id || `${review.courseKey}:${review.studentEmail}`);
    return identity === String(targetId) ? { ...review, moderated: Boolean(moderated), moderationUpdatedAt: new Date().toISOString() } : review;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(REVIEW_EVENT));
}
export function removeReview(courseKey, studentEmail) {
  const reviews = getReviews(true).filter(r => !(r.courseKey === courseKey && r.studentEmail === studentEmail));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(REVIEW_EVENT));
}
