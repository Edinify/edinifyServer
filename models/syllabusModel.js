// 
import mongoose from "mongoose";

const Schema = mongoose.Schema;
// 
const syllabuSchema = new Schema(
  {
    name: {
      type:String,
      // unique: true,
      required:true
    },
    orderNumber: {
      type: Number,
      required: true,
    },
    courseId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    }
  },
  { timestamps: true }
);

export const Syllabus = mongoose.model("Syllabus", syllabuSchema);
