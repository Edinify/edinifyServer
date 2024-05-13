import express from "express";
import {
  createFeedbackByParent,
  createFeedbackByTeacher,
  deleteFeedback,
  getFeedbacksForTeacher,
  getFeedbacksWithPagination,
  updateFeedbackByParent,
  updateFeedbackByTeacher,
} from "../controllers/feedbackController.js";
import {
  authMiddleware,
  checkAdmin,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, checkTeacher, createFeedbackByTeacher);
router.post(
  "/parent",
  authMiddleware,
  checkAdminAndSuperAdmin,
  createFeedbackByParent
);
router.get("/", authMiddleware, getFeedbacksWithPagination);
router.get("/teacher", authMiddleware, checkTeacher, getFeedbacksForTeacher);
router.patch("/:id", authMiddleware, checkTeacher, updateFeedbackByTeacher);
router.patch(
  "/parent/:id",
  authMiddleware,
  checkAdminAndSuperAdmin,
  updateFeedbackByParent
);
router.delete("/:id", authMiddleware, deleteFeedback);

export default router;
