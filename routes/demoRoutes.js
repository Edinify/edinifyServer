import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createDemo,
  deleteDemo,
  getDemosForPagination,
  updateDemo,
} from "../controllers/demoController.js";

const router = express.Router();

router.get("/pagination", authMiddleware, getDemosForPagination);
router.post("/", authMiddleware, checkAdminAndSuperAdmin, createDemo);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateDemo);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteDemo);

export default router;
