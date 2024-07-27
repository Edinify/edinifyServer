import express from "express";
import {
  getWorkers,
  updateWorker,
  deleteWorker,
  getWorkersForPagination
} from "../controllers/workerController.js";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkSuperAdmin,
} from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkSuperAdmin, getWorkers);
router.get("/pagination",authMiddleware,getWorkersForPagination,checkSuperAdmin)
router.patch("/:id", authMiddleware, checkSuperAdmin, updateWorker);
// router.patch(
//   "/me/password",
//   authMiddleware,
//   checkAdminAndSuperAdmin,
//   updateAdminPassword
// );
// router.patch("/password/:id", updateAdminPasswordWithoutCheckingOldPassword);
router.delete("/:id", authMiddleware, checkSuperAdmin, deleteWorker);

export default router;
