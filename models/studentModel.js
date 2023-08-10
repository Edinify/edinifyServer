import mongoose from "mongoose";

const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    parentName: {
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
    birthday: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
    },
    lessonAmount: {
      type: Number,
      required: true,
    },
    payment: {
      type: Number,
      required: true,
    },
    sector: {
      type: String,
      enum: ["AZ", "RU", "EN"],
      required: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    whereComing: {
      type: String,
      enum: ["instagram", "referral", "event", "externalAds", "other"],
      default: "other",
    },
    status: {
      type: Boolean,
      default: true,
    },
    school: {
      type: String,
      required: true,
    },
    educationDegree: {
      type: String,
      required: true,
    },
    healthStatus: {
      type: String,
      required: true,
    },
    phoneUrgent: {
      type: String,
      required: true,
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
