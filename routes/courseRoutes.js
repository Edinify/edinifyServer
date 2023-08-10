import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourses,
  getCoursesForPagination,
  updateCourse,
} from "../controllers/courseController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getCourses);
router.get("/pagination", authMiddleware, getCoursesForPagination);
router.post("/", authMiddleware, createCourse);
router.patch("/:id", authMiddleware, updateCourse);
router.delete("/:id", authMiddleware, deleteCourse);

export default router;
