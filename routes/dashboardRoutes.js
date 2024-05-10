import express from "express";
import { authMiddleware, checkSuperAdmin } from "../middleware/auth.js";
import {
  getActiveStudentsCount,
  getAdvertisingStatistics,
  getCancelledLessonsCount,
  getConfirmedDemosCount,
  getConfirmedLessonsCount,
  getCoursesStatistics,
  getFinance,
  getHeldDemosCount,
  getLessonsCountChartData,
  getTachersResults,
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
router.get(
  "/advertising",
  authMiddleware,
  checkSuperAdmin,
  getAdvertisingStatistics
);
router.get("/leadboard", authMiddleware, checkSuperAdmin, getTachersResults);
router.get("/chart", getLessonsCountChartData);
router.get(
  "/active-student",
  authMiddleware,
  checkSuperAdmin,
  getActiveStudentsCount
);
router.get("/held-demo", authMiddleware, checkSuperAdmin, getHeldDemosCount);
router.get(
  "/confirmed-demo",
  authMiddleware,
  checkSuperAdmin,
  getConfirmedDemosCount
);

export default router;
