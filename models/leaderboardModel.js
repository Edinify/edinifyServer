import mongoose from "mongoose";

const Schema = mongoose.Schema;

const leaderboardSchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    lessonCount: {
      type: Number,
      required: true,
    },
    starCount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
