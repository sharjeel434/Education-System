import mongoose from "mongoose";
const schema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
  moderated: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ courseId: 1, studentId: 1 }, { unique: true });
export default mongoose.model("CourseReview", schema);
