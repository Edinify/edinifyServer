import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  deleteTeacher,
  getTeacherChartData,
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
router.get("/me/chart", getTeacherChartData);

export default router;
