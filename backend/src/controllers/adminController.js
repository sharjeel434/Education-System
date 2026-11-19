
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";

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

    teacher.teacherStatus = "approved";
    await teacher.save();

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

    teacher.teacherStatus = "rejected";
    await teacher.save();

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
