import mongoose from "mongoose";

const Schema = mongoose.Schema;

const salarySchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    teacherSalary: {
      monthly: { type: Boolean, required: true },
      hourly: { type: Boolean, required: true },
      value: { type: Number, required: true },
    },
    confirmedCount: {
      type: Number,
      default: 0,
    },
    cancelledCount: {
      type: Number,
      default: 0,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bonus",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Salary = mongoose.model("Salary", salarySchema);
