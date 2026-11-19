import express from "express";
import { getAllTeachers, getPendingTeachers, approveTeacher, rejectTeacher } from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getPendingVerifications, viewVerificationImage, reviewVerification } from "../controllers/adminVerificationController.js";

import { getPendingVerifications as getPendingStudentVerifications, viewVerificationImage as viewStudentVerificationImage, reviewVerification as reviewStudentVerification } from "../controllers/adminStudentVerificationController.js";

const router = express.Router();
router.use(protect, authorize("admin"));

// Existing teacher management, unchanged.
router.get("/teachers/pending", getPendingTeachers);
router.get("/teachers", getAllTeachers);
router.patch("/teachers/:id/approve", approveTeacher);
router.patch("/teachers/:id/reject", rejectTeacher);

// Identity verification: authenticated Admin only.
router.get("/verifications", getPendingVerifications);
router.get("/verifications/:id/document/:side", viewVerificationImage);
router.patch("/verifications/:id/:decision", reviewVerification);

// Student identity verification, Admin-only
router.get("/student-verifications", getPendingStudentVerifications);
router.get("/student-verifications/:id/document/:side", viewStudentVerificationImage);
router.patch("/student-verifications/:id/:decision", reviewStudentVerification);

export default router;
