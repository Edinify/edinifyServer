import express from "express";
import {
  createCurrentLessonsFromMainLessons,
  createLesson,
  deleteLessonInMainPanel,
  deleteLessonInTablePanel,
  getLesson,
  getWeeklyLessonsForCurrentTable,
  getWeeklyLessonsForMainPanel,
  getWeeklyLessonsForMainTable,
  updateLessonInMainPanel,
  updateLessonInTable,
} from "../controllers/lessonController.js";
import { authMiddleware } from "../middleware/auth.js";
import { getUpdateButtonStatus } from "../controllers/updateButtonController.js";

const router = express.Router();

router.get("/main", authMiddleware, getWeeklyLessonsForMainTable);
router.get("/current", authMiddleware, getWeeklyLessonsForCurrentTable);
router.get("/update-button", authMiddleware, getUpdateButtonStatus);
router.get("/main/panel", authMiddleware, getWeeklyLessonsForMainPanel);
router.post("/", authMiddleware, createLesson);
router.post(
  "/current/all",
  authMiddleware,
  createCurrentLessonsFromMainLessons
);
router.patch("/main/panel/:id", authMiddleware, updateLessonInMainPanel);
router.patch("/table/:id", authMiddleware, updateLessonInTable);
router.delete("/main/panel/:id", authMiddleware, deleteLessonInMainPanel);
router.delete("/table/panel/:id", authMiddleware, deleteLessonInTablePanel);

export default router;
