import mongoose from "mongoose";

const Schema = mongoose.Schema;

const salarySchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    confirmedCount: {
      type: Number,
      require: true,
    },
    canceledCount: {
      type: Number,
      required: true,
    },
    participantCount: {
      type: Number,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Salary = mongoose.model("Salary", salarySchema);
