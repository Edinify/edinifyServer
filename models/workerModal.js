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
    position: {
      type: String,
      require: true,
    },
    number: {
      type: Number,
      require: true,
    },
    role: {
      type: String,
      default:"worker",
      required: true,
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);
