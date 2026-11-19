import mongoose from "mongoose";

// Only a SHA-256 hash is stored. Never store raw reset tokens.
const passwordResetTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, enum: ["student", "teacher", "admin"], required: true },
  sessionVersion: { type: Number, min: 0 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, versionKey: false });

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("PasswordResetToken", passwordResetTokenSchema);
