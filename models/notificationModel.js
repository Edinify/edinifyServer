import mongoose from "mongoose";

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["birthday", "count", "update-table"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    isZeroClassCount: {
      type: Boolean,
      required: function () {
        return this.role === "count";
      },
    },
    isUpdatedTable: {
      type: Boolean,
      required: function () {
        return this.role === "update-table";
      },
    },
    isBirthday: {
      type: Boolean,
      required: function () {
        return this.role === "birthday";
      },
    },
    isViewedAdmin: {
      type: [
        {
          admin: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          viewed: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    isViewedTeacher: {
      type: [
        {
          teacher: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          viewed: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    isViewedStudent: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          viewed: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
