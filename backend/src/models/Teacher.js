import mongoose from "mongoose";
import { userSchema } from "./User.js";

const Teacher = mongoose.model("Teacher", userSchema.clone(), "teachers");
export default Teacher;
