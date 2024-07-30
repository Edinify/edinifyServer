import mongoose from "mongoose";

const Schema = mongoose.Schema;

const receiptScheama = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: function () {
        if (this.creatorRole === "teacher") return "Teacher";
        if (this.creatorRole === "worker") return "Worker";
        if (this.creatorRole === "admin" || this.creatorRole === "super-admin")
          return "Admin";
      },
    },
    creatorRole: {
      type: String,
      required: true,
    },
    branchName: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productCount: {
      type: Number,
      required: true,
    },
    initialAmount: {
      type: Number,
      required: true,
    },
    principalAmount: {
      type: Number,
      required: function () {
        return this.status === "viewed" || this.status === "confirmed";
      },
    },
    confirmedProductCount: {
      type: Number,
      required: function () {
        return this.status === "viewed" || this.status === "confirmed";
      },
    },
    appointment: {
      type: String,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: ["unviewed", "viewed", "confirmed", "cancelled"],
      default: "unviewed",
    },
  },
  { timestamps: true }
);

export const Receipt = mongoose.model("Receipt", receiptScheama);
