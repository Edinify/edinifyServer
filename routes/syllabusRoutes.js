import express from "express";
import {
  createSyllabus,
  deleteSyllabus,
  getSyllabus,
  getSyllabusForPagination,
  updateSyllabus,
} from "../controllers/syllabusController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getSyllabus);
router.get(
  "/pagination",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getSyllabusForPagination
);
router.post("/", authMiddleware, checkAdminAndSuperAdmin, createSyllabus);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateSyllabus);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteSyllabus);

export default router;
