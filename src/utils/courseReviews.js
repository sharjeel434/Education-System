const STORAGE_KEY = "educonnect.courseReviews.v1";
export const REVIEW_EVENT = "educonnect:reviews-changed";
export function getReviews() {
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
export function courseReviewKey(course) {
  return `${String(course.teacherEmail || "demo").trim().toLowerCase()}::${String(course.id)}`;
}
export function saveReview(review) {
  const reviews = getReviews().filter(r => !(r.courseKey === review.courseKey && r.studentEmail === review.studentEmail));
  reviews.push(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(REVIEW_EVENT));
}
export function removeReview(courseKey, studentEmail) {
  const reviews = getReviews().filter(r => !(r.courseKey === courseKey && r.studentEmail === studentEmail));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(REVIEW_EVENT));
}
