import express from "express";
import {
  deleteStudent,
  getStudents,
  updateStudent,
  updateStudentPassword,
  getStudentsByCourseId,
  getStudentsForPagination,
} from "../controllers/studentController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getStudents);
router.get(
  "/pagination",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getStudentsForPagination
);
router.get(
  "/by/course",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getStudentsByCourseId
);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateStudent);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteStudent);
router.patch("/me/password", authMiddleware, updateStudentPassword);

export default router;
