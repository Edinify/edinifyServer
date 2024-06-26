import mongoose from "mongoose";

const Schema = mongoose.Schema;

const demoSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    parentName: {
      type: String,
    },
    age: {
      type: Number,
    },
    sector: {
      type: String,
      enum: ["AZ", "EN", "RU"],
      default: "AZ",
    },
    class: {
      type: String,
    },
    phone: {
      type: String,
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    status: {
      type: String,
      enum: ["appointed", "held", "notHeld", "confirmed", "cancelled"],
      default: "appointed",
    },
  },
  { timestamps: true }
);

export const Demo = mongoose.model("Demo", demoSchema);
