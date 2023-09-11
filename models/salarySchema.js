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
    type: {
      type: String,
      enum: ["monthly", "hourly"],
    },
    bonus: {
      value: {
        type: Number,
        default: 0,
        required: true,
      },
      date: {
        type: Date,
      },
      comment: {
        type: String,
        default: "",
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Salary = mongoose.model("Salary", salarySchema);
