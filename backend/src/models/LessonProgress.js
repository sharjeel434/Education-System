import mongoose from "mongoose";
const schema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true, index: true },
  lessonId: { type: String, required: true, maxlength: 160 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ studentId: 1, courseId: 1, lessonId: 1 }, { unique: true });
export default mongoose.model("LessonProgress", schema);
