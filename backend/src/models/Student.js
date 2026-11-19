import mongoose from "mongoose";
import { userSchema } from "./User.js";

const Student = mongoose.model("Student", userSchema.clone(), "students");
export default Student;
