import express from "express";
import {
  createFeedbackByTeacher,
  deleteFeedback,
  getFeedbacksForTeacher,
  getFeedbacksWithPagination,
  updateFeedbackByTeacher,
} from "../controllers/feedbackController";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, checkTeacher, createFeedbackByTeacher);
router.get(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getFeedbacksWithPagination
);
router.get("/", authMiddleware, checkTeacher, getFeedbacksForTeacher);
router.patch("/:id", authMiddleware, checkTeacher, updateFeedbackByTeacher);
router.delete("/:id", authMiddleware, checkTeacher, deleteFeedback);
