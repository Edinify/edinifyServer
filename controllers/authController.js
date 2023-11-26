//
import { Student } from "../models/studentModel.js";
import { Course } from "../models/courseModel.js";
import { Teacher } from "../models/teacherModel.js";
import { Admin } from "../models/adminModel.js";
import { Token } from "../models/tokenSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  createNotificationForBirthdayAtCreateAndUpdateStudent,
  createNotificationForLessonsCount,
  createNotificationForOneStudentLessonsCount,
} from "./notificationController.js";
import logger from "../config/logger.js";

dotenv.config();

// Register super admin
export const registerSuperAdmin = async (req, res) => {
  const { email, role } = req.body;

  try {
    const regexEmail = new RegExp(email, "i");

    const existingStudent = await Student.findOne({ email: regexEmail });
    const existingTeacher = await Teacher.findOne({ email: regexEmail });
    const existingAdmin = await Admin.findOne({ role: "super-admin" });

    if (existingAdmin) {
      return res.status(409).json({ message: "Super Admin already exists" });
    }

    if (existingStudent || existingTeacher) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    if (role !== "super-admin") {
      return res
        .status(400)
        .json({ message: "The role field validation failed" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const admin = new Admin({ ...req.body, password: hashedPassword });
    await admin.save();

    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register admin
export const registerAdmin = async (req, res) => {
  const { email } = req.body;

  try {
    const regexEmail = new RegExp(email, "i");

    const existingStudent = await Student.findOne({ email: regexEmail });
    const existingTeacher = await Teacher.findOne({ email: regexEmail });
    const existingAdmin = await Admin.findOne({ email: regexEmail });

    if (existingStudent || existingTeacher || existingAdmin) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const admin = new Admin({
      ...req.body,
      password: hashedPassword,
      role: "admin",
    });
    await admin.save();

    res.status(201).json(admin);
  } catch (err) {
    logger.error({
      method: "CREATE",
      status: 500,
      message: err.message,
      for: "CREATE ADMIN",
      user: req.user,
      postedData: { ...req.body, password: "" },
      functionName: registerAdmin.name,
    });

    res.status(500).json({ error: err.message });
  }
};

// Register student
export const registerStudent = async (req, res) => {
  const { email, courses } = req.body;

  try {
    const regexEmail = new RegExp(email, "i");

    const existingAdmin = await Admin.findOne({ email: regexEmail });
    const existingStudent = await Student.findOne({ email: regexEmail });
    const existingTeacher = await Teacher.findOne({ email: regexEmail });

    if (existingAdmin || existingStudent || existingTeacher) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const coursesIds = courses.map((item) => item.course);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const student = new Student({
      ...req.body,
      password: hashedPassword,
    });
    await student.populate("courses.course");
    await student.save();

    await Course.updateMany(
      { _id: { $in: coursesIds } },
      { $addToSet: { students: student._id } }
    );

    if (student.courses.find((item) => item.lessonAmount < 1)) {
      createNotificationForOneStudentLessonsCount(student);
    }

    createNotificationForBirthdayAtCreateAndUpdateStudent(student);

    const studentsCount = await Student.countDocuments({ deleted: false });
    const lastPage = Math.ceil(studentsCount / 10);

    res.status(201).json({ student, lastPage });
  } catch (error) {
    logger.error({
      method: "CREATE",
      status: 500,
      message: err.message,
      for: "CREATE STUDENT",
      user: req.user,
      postedData: {
        ...req.body,
        password: "",
        fin: "",
        seria: "",
        motherPhone: "",
        fatherPhone: "",
        emergencyPhone: "",
        otp: "",
      },
      functionName: registerStudent.name,
    });
    res.status(500).json({ error: error.message });
  }
};

// Register teacher
export const registerTeacher = async (req, res) => {
  const { email } = req.body;

  try {
    const regexEmail = new RegExp(email, "i");

    const existingAdmin = await Admin.findOne({ email: regexEmail });
    const existingStudent = await Student.findOne({ email: regexEmail });
    const existingTeacher = await Teacher.findOne({ email: regexEmail });

    if (existingAdmin || existingStudent || existingTeacher) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const coursesId = req.body.courses;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const teacher = new Teacher({ ...req.body, password: hashedPassword });
    await teacher.populate("courses");
    await teacher.save();



    await Course.updateMany(
      { _id: { $in: coursesId } },
      { $addToSet: { teachers: teacher._id } }
    );

    const teachersCount = await Teacher.countDocuments({ deleted: false });
    const lastPage = Math.ceil(teachersCount / 10);

    res.status(201).json({ teacher: { ...teacher, password: "" }, lastPage });
  } catch (err) {
    logger.error({
      method: "CREATE",
      status: 500,
      message: err.message,
      for: "CREATE TEACHER",
      user: req.user,
      postedData: {
        ...req.body,
        password: "",
        fin: "",
        seria: "",
        phone: "",
        otp: "",
      },
      functionName: registerTeacher.name,
    });

    res.status(500).json({ error: err.message });
  }
};

// Login .
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const regexEmail = new RegExp(email, "i");

    const admin = await Admin.findOne({ email: regexEmail });
    const student = await Student.findOne({ email: regexEmail });
    const teacher = await Teacher.findOne({ email: regexEmail });

    const user = admin || student || teacher;

    console.log(user);
    if (!user) {
      return res.status(404).json({ key: "user-not-found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(404).json({ key: "invalid-password" });
    }

    // refresh and accesstoken callback for creating
    const AccessToken = createAccessToken(user);
    const RefreshToken = createRefreshToken(user);

    saveTokensToDatabase(user._id, RefreshToken, AccessToken);
    // send refresh token to cookies
    res.cookie("refreshtoken", RefreshToken, {
      httpOnly: true,
      path: "/api/user/auth/refresh_token",
      sameSite: "None",
      secure: true,
    });

    res.on("finish", () => {
      console.log("Response Cookies:", res.getHeaders()["set-cookie"]);
    });

    res.status(200).json({
      AccessToken: AccessToken,
      RefreshToken: RefreshToken,
    });
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      for: "LOGIN",
      postedData: req.body,
      functionName: login.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// FORGOTTEN PASSWORD
// Send code to email
export const sendCodeToEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    const student = await Student.findOne({ email });
    const teacher = await Teacher.findOne({ email });

    const user = admin || student || teacher;

    if (!user) {
      return res.status(404).json({ key: "user-not-found" });
    }

    let randomCode = Math.floor(100000 + Math.random() * 900000).toString();

    const mainEmail = process.env.EMAIL;
    const password = process.env.PASS;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: mainEmail,
        pass: password,
      },
    });

    const mailOptions = {
      from: mainEmail,
      to: email,
      subject: "Code to change password at edinfy",
      text: randomCode,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: error });
      } else {
        res.status(200).json({ message: "Code sent successfuly" });
      }
    });

    if (user.role === "admin" || user.role === "super-admin") {
      await Admin.findByIdAndUpdate(user._id, { otp: randomCode });
    } else if (user.role === "teacher") {
      await Teacher.findByIdAndUpdate(user._id, { otp: randomCode });
    } else {
      await Student.findByIdAndUpdate(user._id, { otp: randomCode });
    }

    setTimeout(async () => {
      if (user.role === "admin" || user.role === "super-admin") {
        await Admin.findByIdAndUpdate(user._id, { otp: 0 });
      } else if (user.role === "teacher") {
        await Teacher.findByIdAndUpdate(user._id, { otp: 0 });
      } else {
        await Student.findByIdAndUpdate(user._id, { otp: 0 });
      }
    }, 120000);
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      for: "SEND CODE TO EMAIL FOR FORGET PASSWORD",
      postedData: req.body,
      functionName: sendCodeToEmail.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Check otp kod
export const checkOtpCode = async (req, res) => {
  const { otp } = req.body;

  try {
    const admin = await Admin.findOne({ otp });
    const student = await Student.findOne({ otp });
    const teacher = await Teacher.findOne({ otp });

    const user = admin || student || teacher;

    if (!user) {
      return res.status(404).json({ message: "invalid-otp" });
    }

    const userId = user._id;

    if (user.role === "admin" || user.role === "super-admin") {
      await Admin.findByIdAndUpdate(userId, { otp: 0 });
    } else if (user.role === "teacher") {
      await Teacher.findByIdAndUpdate(userId, { otp: 0 });
    } else {
      await Student.findByIdAndUpdate(userId, { otp: 0 });
    }

    res.status(200).json({ userId });
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      for: "CHECK OTP CODE",
      postedData: req.body,
      functionName: checkOtpCode.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// Change forgotten password
export const changeForgottenPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const admin = await Admin.findById(userId);
    const student = await Student.findById(userId);
    const teacher = await Teacher.findById(userId);

    const user = admin || student || teacher;

    if (!user) {
      return res.status(404).json({ key: "user-not-found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    if (user.role === "admin" || user.role === "super-admin") {
      await Admin.findByIdAndUpdate(user._id, { password: hashedPassword });
    } else if (user.role === "teacher") {
      await Teacher.findByIdAndUpdate(user._id, { password: hashedPassword });
    } else {
      await Student.findByIdAndUpdate(user._id, { password: hashedPassword });
    }

    res.status(200).json({ key: "change-password" });
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      for: "CHANGE FORGETTEN PASSWORD",
      postedData: req.body,
      functionName: changeForgottenPassword.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// create accesstoken

const createAccessToken = (user) => {
  try {
    const AccessToken = jwt.sign(
      {
        email: user.email,
        role: user.role,
        id: user._id,
        fullName: user.fullName,
      },
      process.env.SECRET_KEY,
      { expiresIn: "6h" }
    );

    return AccessToken;
  } catch (error) {
    logger.error({
      method: "POST",
      message: error.message,
      for: "CREATE ACCESS TOKEN",
      functionName: createAccessToken.name,
      tokenInfo: {
        email: user.email,
        role: user.role,
        id: user._id,
        fullName: user.fullName,
      },
    });
    console.log(error);
  }
};

// create refreshtoken
const createRefreshToken = (user) => {
  const RefreshToken = jwt.sign(
    {
      mail: user.email,
      role: user.role,
      id: user._id,
      fullName: user.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return RefreshToken;
};

// verify refresh token
export const refreshToken = async (req, res) => {
  // console.log(req.headers,'header')
  try {
    const rf_token = req.headers.cookie.split("=")[1];
    // console.log(rf_token);
    const token = await Token.findOne({ refreshToken: rf_token });
    // console.log(token,'db');
    if (token) {
      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          res.clearCookie("refreshtoken", {
            httpOnly: true,
            path: "/api/user/auth/refresh_token",
            sameSite: "None",
            secure: true,
          });
          console.log(err.message);
          revokeTokenFromDatabase(rf_token);
          return res.status(401).json({ message: { error: err.message } });
        } else {
          console.log(user, "new acces ");
          const accesstoken = createAccessToken({
            email: user.mail,
            _id: user.id,
            role: user.role,
          });
          res.json({ accesstoken });
        }
      });
    }
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      for: "VERIFY REFRESH TOKEN",
      functionName: refreshToken.name,
    });

    return res.status(404).json({ msg: err.message });
  }
};

const saveTokensToDatabase = async (userId, refreshToken, accessToken) => {
  const token = new Token({
    userId,
    refreshToken,
    accessToken,
  });

  await token.save();
};

const revokeTokenFromDatabase = async (refreshToken) => {
  await Token.deleteOne({ refreshToken });
};

// Get user
export const getUser = async (req, res) => {
  const { id, role } = req.user;

  try {
    let user;
    if (role === "admin" || role === "super-admin") {
      user = await Admin.findById(id);
    } else if (role === "teacher") {
      user = await Teacher.findById(id);
    } else if (role === "student") {
      user = await Student.findById(id).populate("courses.course");
    }

    if (!user) {
      return res.status(404).json({ message: "not found user" });
    }

    const userObj = user.toObject();

    delete userObj.password;

    res.status(200).json(userObj);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET USER",
      user: req.user,
      functionName: getUser.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};
