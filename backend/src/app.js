import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teacherVerificationRoutes from "./routes/teacherVerificationRoutes.js";
import studentVerificationRoutes from "./routes/studentVerificationRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { clientOrigins as configuredClientOrigins, trustedProxies } from "./config/security.js";
import { rateLimitStore } from "./middleware/rateLimitStore.js";
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", trustedProxies());
app.use(helmet());
const clientOrigins = configuredClientOrigins();
app.use(cors({ origin: [...clientOrigins], credentials: true }));
app.use(cookieParser());
app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false, ...rateLimitStore("api") }));
// Cookie-authenticated requests must come from the configured frontend origin.
// Require an AJAX-only header on every authenticated mutation to prevent form CSRF.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !clientOrigins.has(origin)) {
    return res.status(403).json({ success: false, message: "Origin not allowed." });
  }
  if (!origin && process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, message: "Origin required." });
  }
  if (req.get("X-Requested-With") !== "XMLHttpRequest") {
    return res.status(403).json({ success: false, message: "Request verification header missing." });
  }
  next();
});
app.use("/api/content", express.json({ limit: "12mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => res.json({ success: true, message: "Welcome to EduConnect AI Backend" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher/verification", teacherVerificationRoutes);
app.use("/api/student/verification", studentVerificationRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
