import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  deleteTeacher,
  getTeacher,
  getTeachers,
  getTeachersForPagination,
  updateTeacher,
  updateTeacherPassword,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", authMiddleware, getTeachers);
router.get("/pagination", authMiddleware, getTeachersForPagination);
router.get("/:id", authMiddleware, getTeacher);
router.patch("/:id", authMiddleware, updateTeacher);
router.delete("/:id", authMiddleware, deleteTeacher);
router.patch("/me/password", authMiddleware, updateTeacherPassword);

export default router;
