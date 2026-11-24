
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import { recordAdminAction } from "../services/auditService.js";

const auditTeacherDecision = (req, teacher, status) => recordAdminAction({
  actorEmail: req.user.email, actorRole: req.user.role, actorId: req.user._id,
  action: `Teacher ${status}`, category: "teacher-applications", module: "Teacher Applications",
  entityType: "Teacher", entityId: String(teacher._id), targetId: String(teacher._id),
  targetName: teacher.email, result: status === "approved" ? "Approved" : "Rejected",
  description: `${req.user.fullName || req.user.email} ${status === "approved" ? "approved" : "rejected"} teacher application for ${teacher.email}.`,
});

// Get pending teachers
export const getPendingTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({
      teacherStatus: "pending"
    })
      .select("_id fullName email teacherStatus isActive createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    next(error);
  }
};

// Approve teacher
export const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    if (teacher.teacherStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending teachers can be approved"
      });
    }

    if (String(teacher._id) === String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "A user cannot approve or reject their own teacher application."
      });
    }

    teacher.teacherStatus = "approved";
    await teacher.save();
    await auditTeacherDecision(req, teacher, "approved");

    res.status(200).json({
      success: true,
      message: "Teacher approved successfully",
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        teacherStatus: teacher.teacherStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reject teacher
export const rejectTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    if (teacher.teacherStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending teachers can be rejected"
      });
    }

    if (String(teacher._id) === String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "A user cannot approve or reject their own teacher application."
      });
    }

    teacher.teacherStatus = "rejected";
    await teacher.save();
    await auditTeacherDecision(req, teacher, "rejected");

    res.status(200).json({
      success: true,
      message: "Teacher rejected successfully",
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        teacherStatus: teacher.teacherStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({})
      .select("_id fullName email teacherStatus isActive createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    next(error);
  }
};
