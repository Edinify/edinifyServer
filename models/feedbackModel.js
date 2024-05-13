//
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const feedbackSchema = new Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: function () {
        return this.from !== "parent";
      },
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    parentName: {
      type: String,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    from: {
      type: String,
      enum: ["teacher", "student", "parent"],
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
