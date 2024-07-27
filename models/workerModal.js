//
import mongoose from "mongoose";

const Schema = mongoose.Schema;
//
const workerSchema = new Schema(
  {
    fullName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    department: {
      type: String,
      require: true,
    },
    number: {
      type: Number,
    },
    role: {
      type: String,
      default: "worker",
    },
    positions: {
      type: Array,
    },
    profiles: {
      type: Array,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);
