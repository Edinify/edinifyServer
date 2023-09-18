import mongoose from "mongoose";

const Schema = mongoose.Schema;

const earningsSchema = new Schema({
  earnings: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

export const Earning = mongoose.model("Earning", earningsSchema);
