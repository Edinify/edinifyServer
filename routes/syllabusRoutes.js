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
router.post(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  createSyllabus,
  getSyllabusForPagination
);
router.patch(
  "/:id",
  authMiddleware,
  checkAdminAndSuperAdmin,
  updateSyllabus,
  getSyllabusForPagination
);
router.delete(
  "/:id",
  authMiddleware,
  checkAdminAndSuperAdmin,
  deleteSyllabus,
  getSyllabusForPagination
);

export default router;
