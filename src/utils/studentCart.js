
const cartKey = (email) => `educonnect.student.${email}.cart`;
const enrollmentKey = (email) => `educonnect.student.${email}.enrollments`;
const orderKey = (email) => `educonnect.student.${email}.orders`;
export const ORDERS_EVENT = "educonnect:orders-changed";

function readList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function notifyChange() {
  window.dispatchEvent(new Event("educonnect:student-data-changed"));
}

export function getStudentEmail() {
  const role = sessionStorage.getItem("educonnect.demoRole");
  const email = sessionStorage.getItem("educonnect.demoEmail");
  return role === "Student" && email ? email.toLowerCase() : null;
}

export function getCart(email) {
  return email ? readList(cartKey(email)) : [];
}

export function getEnrollments(email) {
  return email ? readList(enrollmentKey(email)) : [];
}

export function getStudentOrders(email) {
  return email ? readList(orderKey(email)) : [];
}

export function addToCart(email, course) {
  if (!email || !course?.id) return false;

  const cart = getCart(email);
  const id = String(course.id);
  if (cart.some((item) => String(item.id) === id)) return false;

  if (getEnrollments(email).some((item) => String(item.id) === id)) {
    return false;
  }

  cart.push({
    id: course.id,
    title: course.title,
    category: course.category || "Development",
    instructor: course.instructorName || course.instructor || "Instructor",
    price: Math.max(0, Number(course.price) || 0),
    thumbnail: course.thumbnail || "",
    lessons: Array.isArray(course.lessons) ? course.lessons : Number(course.lessons) || 0,
    teacherEmail: course.teacherEmail || ""
  });

  localStorage.setItem(cartKey(email), JSON.stringify(cart));
  notifyChange();
  return true;
}

export function removeFromCart(email, id) {
  if (!email) return;
  const updated = getCart(email).filter((item) => String(item.id) !== String(id));
  localStorage.setItem(cartKey(email), JSON.stringify(updated));
  notifyChange();
}

export function demoCheckout(email) {
  if (!email) throw new Error("Student login required.");

  const cart = getCart(email);
  if (!cart.length) throw new Error("Your cart is empty.");

  const enrolled = getEnrollments(email);
  const newCourses = cart
    .filter((item) => !enrolled.some((course) => String(course.id) === String(item.id)))
    .map((item) => ({
      ...item,
      completedLessons: 0,
      progress: 0,
      enrolledAt: new Date().toISOString()
    }));

  const purchasedAt = new Date().toISOString();
  const order = {
    id: window.crypto?.randomUUID?.() || `demo-order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status: "Completed",
    purchasedAt,
    studentEmail: email.toLowerCase(),
    items: newCourses.map(({ completedLessons, progress, enrolledAt, ...item }) => item)
  };

  localStorage.setItem(
    enrollmentKey(email),
    JSON.stringify([...enrolled, ...newCourses])
  );
  localStorage.setItem(
    orderKey(email),
    JSON.stringify([...getStudentOrders(email), order])
  );
  localStorage.setItem(cartKey(email), JSON.stringify([]));
  notifyChange();
  window.dispatchEvent(new Event(ORDERS_EVENT));

  return newCourses;
}
