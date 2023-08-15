import mongoose from "mongoose";

const Schema = mongoose.Schema;

const incomeSchema = new Schema(
  {
    payer: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    unitMeasurement: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    IMX: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Income = mongoose.model("Income", incomeSchema);
