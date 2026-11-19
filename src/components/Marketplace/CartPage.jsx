import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { getCart, removeFromCart, demoCheckout } from "../../utils/studentCart";
import "./CartPage.css";

export default function CartPage({ email, onBack, onComplete }) {
  const [cart, setCart] = useState(() => getCart(email));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  function removeCourse(id) {
    removeFromCart(email, id);
    setCart(getCart(email));
  }

  async function checkout() {
    try {
      await demoCheckout(email);
      setCart([]);
      setSuccess(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="edc-cart-page">
      <button className="edc-cart-back" onClick={onBack} type="button">
        <ArrowLeft size={17} /> Back to Courses
      </button>

      <header className="edc-cart-header">
        <span className="edc-cart-icon"><ShoppingCart size={23} /></span>
        <div>
          <p className="edc-cart-eyebrow">YOUR LEARNING LIST</p>
          <h1>Shopping Cart</h1>
          <p>Review your courses before completing demo checkout.</p>
        </div>
      </header>

      {success ? (
        <section className="edc-cart-success" role="status">
          <span className="edc-cart-success-icon"><CheckCircle2 size={34} /></span>
          <h2>Enrollment successful!</h2>
          <p>Your courses are ready in My Learning.</p>
          <button className="edc-cart-primary" onClick={onComplete} type="button">
            Go to My Learning <GraduationCap size={18} />
          </button>
        </section>
      ) : cart.length === 0 ? (
        <section className="edc-cart-empty">
          <span className="edc-cart-empty-icon"><ShoppingCart size={30} /></span>
          <h2>Your cart is empty</h2>
          <p>Find a course you like and add it here to continue.</p>
          <button className="edc-cart-primary" onClick={onBack} type="button">
            Explore courses <BookOpen size={18} />
          </button>
        </section>
      ) : (
        <div className="edc-cart-layout">
          <section className="edc-cart-items" aria-label="Courses in your cart">
            <div className="edc-cart-items-heading">
              <h2>Courses</h2>
              <span>{cart.length} {cart.length === 1 ? "course" : "courses"}</span>
            </div>

            {cart.map((course) => (
              <article className="edc-cart-course" key={course.id}>
                <div className="edc-cart-course-image">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" />
                  ) : (
                    <GraduationCap size={29} />
                  )}
                </div>
                <div className="edc-cart-course-info">
                  <span className="edc-cart-course-category">{course.category || "Course"}</span>
                  <h3>{course.title}</h3>
                  <p>By {course.instructor}</p>
                  <span className="edc-cart-course-lessons">
                    <BookOpen size={14} /> {Array.isArray(course.lessons)
                      ? course.lessons.length
                      : Number(course.lessons) || 0} lessons
                  </span>
                </div>
                <div className="edc-cart-course-actions">
                  <strong>PKR {(Number(course.price) || 0).toLocaleString()}</strong>
                  <button
                    className="edc-cart-remove"
                    onClick={() => removeCourse(course.id)}
                    type="button"
                    aria-label={`Remove ${course.title} from cart`}
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="edc-cart-summary">
            <h2>Order Summary</h2>
            <div className="edc-cart-summary-row">
              <span>Courses</span><span>{cart.length}</span>
            </div>
            <div className="edc-cart-summary-row">
              <span>Subtotal</span><span>PKR {total.toLocaleString()}</span>
            </div>
            <div className="edc-cart-total">
              <span>Total</span><strong>PKR {total.toLocaleString()}</strong>
            </div>
            <p className="edc-cart-demo-note">Demo checkout only. No real payment will be collected.</p>
            {error && <p className="edc-cart-error" role="alert">{error}</p>}
            <button className="edc-cart-primary edc-cart-checkout" onClick={checkout} type="button">
              Complete Demo Checkout
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
