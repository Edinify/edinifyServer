import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourses,
  getCoursesForPagination,
  updateCourse,
} from "../controllers/courseController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getCourses);
router.get(
  "/pagination",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getCoursesForPagination
);
router.post("/", authMiddleware, checkAdminAndSuperAdmin, createCourse);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateCourse);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteCourse);

export default router;
