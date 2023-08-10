import { Student } from "../models/studentModel.js";
import { Course } from "../models/courseModel.js";
import { Teacher } from "../models/teacherModel.js";
import { Admin } from "../models/adminModel.js";
import { Token } from "../models/tokenSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Notification } from "../models/notificationModel.js";

dotenv.config();

// Register admin
export const registerAdmin = async (req, res) => {
  const { email } = req.body;
  try {
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingStudent || existingTeacher || existingAdmin) {
      return res
        .status(400)
        .json({ message: "A user with the same email already exists" });
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

// Register student
export const registerStudent = async (req, res) => {
  const { email } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });

    if (existingAdmin || existingStudent || existingTeacher) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const coursesId = req.body.courses;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const student = new Student({
      ...req.body,
      courses: coursesId,
      password: hashedPassword,
    });
    await student.save();

    await Course.updateMany(
      { _id: { $in: coursesId } },
      { $addToSet: { students: student._id } }
    );

    const studentWithCourses = await Student.findById(student._id).populate(
      "courses"
    );

    const currFirstDate = new Date();
    const currSecondDate = new Date();
    const currThirdDate = new Date();
    const studentBirthday = new Date(student.birthday);
    currSecondDate.setDate(currSecondDate.getDate() + 1);
    currThirdDate.setDate(currThirdDate.getDate() + 2);
    const studentBirthdayDate = studentBirthday.getDate();
    const studentBirthdayMonth = studentBirthday.getMonth() + 1;

    if (
      (currFirstDate.getDate() === studentBirthdayDate &&
        currFirstDate.getMonth() + 1 === studentBirthdayMonth) ||
      (currSecondDate.getDate() === studentBirthdayDate &&
        currSecondDate.getMonth() + 1 === studentBirthdayMonth) ||
      (currThirdDate.getDate() === studentBirthdayDate &&
        currThirdDate.getMonth() + 1 === studentBirthdayMonth)
    ) {
      await Notification.create({
        role: "birthday",
        student: student._id,
        isBirthday: true,
      });
    }

    const studentsCount = await Student.countDocuments();
    const lastPage = Math.ceil(studentsCount / 10);

    res.status(201).json({ student: studentWithCourses, lastPage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register teacher
export const registerTeacher = async (req, res) => {
  const { email } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });

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

    const teachersCount = await Teacher.countDocuments();
    const lastPage = Math.ceil(teachersCount / 10);

    res.status(201).json({ teacher, lastPage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    const student = await Student.findOne({ email });
    const teacher = await Teacher.findOne({ email });

    const user = admin || student || teacher;

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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.status(200).json({
      AccessToken: AccessToken,
      RefreshToken: RefreshToken,
    });
  } catch (err) {
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
      return res.status(404).json({ key: "User is not found" });
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
      to: "ceyhunresulov23@gmail.com",
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

    user.otp = randomCode;

    await user.save();

    setTimeout(async () => {
      console.log("salam set time out");
      user.otp = 0;
      await user.save();
    }, 120000);
  } catch (err) {
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
      return res.status(404).json({ message: "User is not found" });
    }

    const userId = user._id;

    user.otp = 0;

    await user.save();

    res.status(200).json({ userId });
  } catch (err) {
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
      return res.status(404).json({ message: "User is not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.otp = 0;

    await user.save();

    res.status(200).json("password changed successfully");
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// create accesstoken
const createAccessToken = (user) => {
  const AccessToken = jwt.sign(
    { email: user.email, role: user.role, id: user._id },
    process.env.SECRET_KEY,
    { expiresIn: "6h" }
  );
  return AccessToken;
};

// create refreshtoken
const createRefreshToken = (user) => {
  const RefreshToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return RefreshToken;
};

// verify refresh token
export const refreshToken = async (req, res) => {
  try {
    console.log(req.headers.cookie);
    const rf_token = req.headers.cookie.split("=")[1];

    const token = await Token.findOne({ refreshToken: rf_token });

    if (token) {
      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          revokeTokenFromDatabase(rf_token);
          return res.status(400).json({ msg: "Please Login or Register" });
        } else {
          const accesstoken = createAccessToken({
            email: user.email,
            id: user.id,
            role: user.role,
          });
          res.json({ accesstoken });
        }
      });
    }
  } catch (err) {
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
      user = await Student.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: "not found user" });
    }

    const userObj = user.toObject();

    delete userObj.password;

    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// const getWeeksBetweenDates = (start, end) => {
//   let weeksList = [];

//   const startDate = new Date(start);
//   const endDate = new Date(end);

//   let startWeek = new Date(startDate);
//   let endWeek = new Date(startDate);

//   if (endWeek.getDay() > 0) {
//     endWeek.setDate(startDate.getDate() + (7 - startDate.getDay()));
//   }

//   const lastWeekEndDay = new Date(endDate);

//   if (lastWeekEndDay.getDay() > 0) {
//     lastWeekEndDay.setDate(
//       lastWeekEndDay.getDate() + (7 - lastWeekEndDay.getDay())
//     );
//   }
//   lastWeekEndDay.setDate(lastWeekEndDay.getDate() + 1);

//   while (lastWeekEndDay > endWeek) {
//     weeksList.push({
//       startWeek: startWeek.toString(),
//       endWeek: endWeek.toString(),
//       allWeekDays: {
//         monday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 6)
//         ).toString(),
//         tuesday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 5)
//         ).toString(),
//         wednesday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 4)
//         ).toString(),
//         thursday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 3)
//         ).toString(),
//         friday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 2)
//         ).toString(),
//         saturday: new Date(
//           new Date(endWeek).setDate(endWeek.getDate() - 1)
//         ).toString(),
//         sunday: endWeek.toString(),
//       },
//     });

//     if (startWeek.getDay() === 0) {
//       startWeek.setDate(startWeek.getDate() + 1);
//     } else {
//       startWeek.setDate(startWeek.getDate() + (8 - startWeek.getDay()));
//     }

//     endWeek.setDate(endWeek.getDate() + 7);
//   }

//   weeksList.at(-1).endWeek = endDate.toString();
//   console.log(weeksList);
// };

// getWeeksBetweenDates("2023-07-04", "2023-08-18");
