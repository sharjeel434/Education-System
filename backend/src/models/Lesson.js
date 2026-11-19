import mongoose from "mongoose";
const lessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "OwnedCourse", required: true, immutable: true, index: true },
  title: { type: String, trim: true, required: true, maxlength: 160 },
  content: { type: String, default: "", maxlength: 20000 },
  order: { type: Number, min: 0, max: 10000, default: 0 },
}, { timestamps: true, strict: "throw" });
export default mongoose.model("OwnedLesson", lessonSchema, "owned_lessons");
