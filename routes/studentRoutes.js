import express from "express";
import {
  deleteStudent,
  getStudents,
  updateStudent,
  getStudent,
  updateStudentPassword,
  getStudentsByCourseId,
  getStudentsForPagination,
} from "../controllers/studentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getStudents);
router.get("/pagination", authMiddleware, getStudentsForPagination);
router.get("/:id", authMiddleware, getStudent);
router.get("/by/course", getStudentsByCourseId);
router.patch("/:id", authMiddleware, updateStudent);
router.delete("/:id", authMiddleware, deleteStudent);
router.patch("/me/password", authMiddleware, updateStudentPassword);

export default router;
