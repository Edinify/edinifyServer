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
    status: {
      type: String,
      enum: ["held", "notHeld", "confirmed", "cancelled"],
      default: "notHeld",
    },
  },
  { timestamps: true }
);

export const Demo = mongoose.model("Demo", demoSchema);
