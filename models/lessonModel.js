import mongoose from "mongoose";

const Schema = mongoose.Schema;

const lessonSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["main", "current"],
    },
    date: {
      type: Date,
      required: function () {
        return this.role === "current";
      },
    },
    time: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Teacher",
    },
    students: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
          },
          attendance: {
            type: Number,
            default: 0,
          },
          ratingByStudent: {
            type: Number,
            default: 0,
          },
          noteByStudent: {
            type: String,
            default: "",
          },
        },
      ],
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["unviewed", "confirmed", "cancelled"],
      default: "unviewed",
    },
    note: {
      type: String,
    },
    task: {
      type: String,
    },
    salary: {
      type: Number,
      required: true,
    },
    earnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Lesson = mongoose.model("Lesson", lessonSchema);
