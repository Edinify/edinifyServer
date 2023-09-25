import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  deleteTeacher,
  getTeacherCancelledLessonsCount,
  getTeacherChartData,
  getTeacherConfirmedLessonsCount,
  getTeacherLeadboardOrder,
  getTeacherUnviewedLessons,
  getTeachers,
  getTeachersForPagination,
  updateTeacher,
  updateTeacherPassword,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getTeachers);
router.get(
  "/pagination",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getTeachersForPagination
);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateTeacher);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteTeacher);
router.patch("/me/password", authMiddleware, updateTeacherPassword);
router.get("/me/chart", authMiddleware, checkTeacher, getTeacherChartData);
router.get(
  "/me/confirmed-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherConfirmedLessonsCount
);
router.get(
  "/me/cancelled-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherCancelledLessonsCount
);
router.get(
  "/me/unviewed-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherUnviewedLessons
);
router.get(
  "/me/leaderboard-order",
  authMiddleware,
  checkTeacher,
  getTeacherLeadboardOrder
);

export default router;
