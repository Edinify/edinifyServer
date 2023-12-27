import express from "express";
import {emailSender} from '../../controllers/email/emailController.js'

const router  = express.Router();


router.post("/edinify", emailSender);

export default router;