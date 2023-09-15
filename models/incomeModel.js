import mongoose from "mongoose";

const Schema = mongoose.Schema;

const incomeSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
    },
    appointment: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true

    }
  },
  { timestamps: true }
);

export const Income = mongoose.model("Income", incomeSchema);
