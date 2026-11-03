
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  bytesToHex,
  utf8ToBytes,
} from "@noble/hashes/utils.js";
import "./AuthPages.css";

const USERS_KEY = "educonnect.registeredUsers";

function findSavedAccount(email) {
  try {
    const users = JSON.parse(
      window.localStorage.getItem(USERS_KEY) || "[]"
    );

    return Array.isArray(users)
      ? users.find(
          (user) =>
            user.email?.toLowerCase() ===
            email.trim().toLowerCase()
        )
      : undefined;
  } catch {
    return undefined;
  }
}

async function checkPassword(user, password) {
  if (typeof user?.password === "string") {
    return user.password === password;
  }

  if (!user?.salt || !user?.passwordHash) {
    return false;
  }

  const passwordHash = bytesToHex(
    sha256(
      utf8ToBytes(`${user.salt}:${password}`)
    )
  );

  return passwordHash === user.passwordHash;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const savedEmail =
    window.localStorage.getItem(
      "educonnect.rememberedEmail"
    ) || "";

  const [email, setEmail] = useState(
    location.state?.registeredEmail || savedEmail
  );

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    Boolean(savedEmail)
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [notice, setNotice] = useState(
    location.state?.registeredEmail
      ? "Registration successful. You can now log in."
      : ""
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    const user = findSavedAccount(email);

    if (!user) {
      setError(
        "This email is not registered yet. Please create an account first."
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!(await checkPassword(user, password))) {
      setError(
        "That password does not match this account."
      );
      return;
    }

    if (rememberMe) {
      window.localStorage.setItem(
        "educonnect.rememberedEmail",
        email.trim().toLowerCase()
      );
    } else {
      window.localStorage.removeItem(
        "educonnect.rememberedEmail"
      );
    }

    window.sessionStorage.setItem(
      "educonnect.demoEmail",
      user.email
    );

    window.sessionStorage.setItem(
      "educonnect.demoRole",
      user.role
    );

    navigate(
      user.role === "Teacher"
        ? "/teacher/dashboard"
        : "/student/dashboard",
      { replace: true }
    );
  };

  const handleForgotPassword = () => {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError(
        "Enter your email address first to request a password reset."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    setNotice(
      "Password reset will be available when account recovery is connected."
    );
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link
          className="auth-brand"
          to="/"
          aria-label="EduConnect AI home"
        >
          <span className="auth-brand-icon">
            <GraduationCap size={22} />
          </span>

          <span>
            EduConnect <b>AI</b>
          </span>
        </Link>

        <p>
          New to EduConnect?{" "}
          <Link to="/signup">
            Create account
          </Link>
        </p>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <span className="auth-kicker">
            <BookOpen size={15} />
            LEARNING STARTS HERE
          </span>

          <h1>
            Your learning
            <br />
            journey <em>continues.</em>
          </h1>

          <p>
            Sign in to continue exploring classes,
            subjects, and learning resources.
          </p>

          <div className="auth-points">
            <span>
              <i>
                <BookOpen size={17} />
              </i>
              Pick up where you left off
            </span>

            <span>
              <i>
                <GraduationCap size={18} />
              </i>
              Find resources for your role
            </span>
          </div>

          <div
            className="auth-illustration"
            aria-hidden="true"
          >
            <div className="auth-illustration-book">
              <BookOpen size={34} />
            </div>

            <div className="auth-illustration-note">
              <span>YOUR LEARNING SPACE</span>
              <b>Ready when you are</b>
              <i />
            </div>

            <div className="auth-illustration-cap">
              <GraduationCap size={17} />
            </div>
          </div>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <span className="auth-mobile-icon">
              <GraduationCap size={21} />
            </span>

            <span className="auth-eyebrow">
              WELCOME BACK
            </span>

            <h2>Log in to your account</h2>

            <p className="auth-description">
              Enter your details to continue learning.
            </p>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="auth-input-wrap">
                <Mail size={17} />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>

              <div className="auth-password-label">
                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <div className="auth-input-wrap">
                <LockKeyhole size={17} />

                <input
                  id="login-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  className="auth-eye"
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (visible) => !visible
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                />

                <span>Remember me</span>
              </label>

              {error && (
                <p
                  className="auth-message auth-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {notice && (
                <p
                  className="auth-message auth-notice"
                  role="status"
                >
                  {notice}
                </p>
              )}

              <button
                className="auth-submit"
                type="submit"
              >
                Log in
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="auth-signup-prompt">
              Don’t have an account?{" "}
              <Link to="/signup">
                Sign up
              </Link>
            </p>

            <p className="auth-demo-note">
              Register this email before logging in.
              This frontend preview keeps account
              details in this browser.
            </p>
          </div>
        </section>
      </div>

      <footer className="auth-footer">
        Copyright 2026 EduConnect AI
        <span>·</span>
        Learn something new today.
      </footer>
    </main>
  );
}

export default LoginPage;
