import mongoose from "mongoose";

const Schema = mongoose.Schema;

const teacherSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    salary: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "teacher",
    },
    fincode: {
      type: String,
    },
    seriaNumber: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    workExperience: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      required: true,
    },
    disability: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      enum: ["AZ", "RU", "EN"],
      required: true,
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
