import mongoose from "mongoose";

const Schema = mongoose.Schema;
const syllabuSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: Number,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  { timestamps: true }
);

syllabuSchema.index({ orderNumber: 1 });

export const Syllabus = mongoose.model("Syllabus", syllabuSchema);
