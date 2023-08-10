import mongoose from "mongoose";

const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    students: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    teachers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
