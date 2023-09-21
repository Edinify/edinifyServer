import express from "express";
import { authMiddleware, checkSuperAdmin } from "../middleware/auth.js";
import {
  getCancelledLessonsCount,
  getConfirmedLessonsCount,
  getCoursesStatistics,
  getFinance,
  getUnviewedLessons,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/confirmed",
  authMiddleware,
  checkSuperAdmin,
  getConfirmedLessonsCount
);
router.get(
  "/cancelled",
  authMiddleware,
  checkSuperAdmin,
  getCancelledLessonsCount
);
router.get("/unviewed", authMiddleware, checkSuperAdmin, getUnviewedLessons);
router.get("/finance", authMiddleware, checkSuperAdmin, getFinance);
router.get(
  "/course-statistic",
  authMiddleware,
  checkSuperAdmin,
  getCoursesStatistics
);

export default router;
