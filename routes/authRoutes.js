import express from "express";
import {
  changeForgottenPassword,
  login,
  registerAdmin,
  registerStudent,
  registerTeacher,
  refreshToken,
  getUser,
  sendCodeToEmail,
  checkOtpCode,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.post("/admin/sign", registerAdmin);
router.post("/student/sign", authMiddleware, registerStudent);
router.post("/teacher/sign", authMiddleware, registerTeacher);
router.post("/login", login);
router.get("/refresh_token", refreshToken);
router.post("/login/forget/send_to_email", sendCodeToEmail);
router.post("/login/forget/check_otp", checkOtpCode);
router.patch("/login/forget/change_password", changeForgottenPassword);

export default router;
