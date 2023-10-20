import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import bcrypt from "bcrypt";
import {
  createNotificationForBirthdayAtCreateAndUpdateStudent,
  createNotificationForLessonsCount,
  createNotificationForOneStudentLessonsCount,
  deleteNotificationForLessonCount,
  deleteNotificationForOneStudentLessonCount,
} from "./notificationController.js";
import { Admin } from "../models/adminModel.js";
import { Teacher } from "../models/teacherModel.js";

// Get students

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password")
      .populate("courses.course");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students for pagination
export const getStudentsForPagination = async (req, res) => {
  const { searchQuery, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  // console.log(req.query, "======");
  try {
    let totalPages;
    let students;
    let filterObj = {};

    if (status === "active") filterObj.status = true;

    if (status === "deactive") filterObj.status = false;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const studentsCount = await Student.countDocuments({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
        ...filterObj,
      });

      students = await Student.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses.course");

      totalPages = Math.ceil(studentsCount / limit);
    } else {
      const studentsCount = await Student.countDocuments({
        deleted: false,
        ...filterObj,
      });
      totalPages = Math.ceil(studentsCount / limit);
      students = await Student.find({ deleted: false, ...filterObj })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses.course");
    }

    const studentList = students.map((student) => ({
      ...student.toObject(),
      password: "",
    }));

    res.status(200).json({ students: studentList, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students by course id
export const getStudentsByCourseId = async (req, res) => {
  const { courseId, day, time, role, date } = req.query;

  const targetDate = new Date(date);
  const targetMonth = targetDate.getMonth() + 1;
  const targetYear = targetDate.getFullYear();
  const targetDayOfMonth = targetDate.getDate();

  try {
    const students = await Student.find({
      "courses.course": courseId,
      status: true,
      deleted: false,
    });

    const newStudents = await Promise.all(
      students.map(async (student) => {
        let checkStudent;
        if (role === "main") {
          checkStudent = await Lesson.findOne({
            "students.student": student._id,
            day: day,
            time: time,
            role: role,
          });

          console.log("main");
        } else if (role === "current") {
          console.log(targetYear, "target year");
          console.log(targetMonth, "target month");
          console.log(targetDayOfMonth, "target day");
          console.log(student, "student");
          console.log(day, "day");
          console.log(time, "time");
          console.log(role, "role");
          checkStudent = await Lesson.findOne({
            "students.student": student._id,
            day: day,
            time: time,
            role: role,
            status: {
              $in: ["unviewed", "confirmed"],
            },
            $expr: {
              $and: [
                { $eq: [{ $year: "$date" }, targetYear] },
                { $eq: [{ $month: "$date" }, targetMonth] },
                { $eq: [{ $dayOfMonth: "$date" }, targetDayOfMonth] },
              ],
            },
          });
        }

        console.log(2, checkStudent);

        if (checkStudent) {
          return { ...student.toObject(), disable: true };
        } else {
          return { ...student.toObject(), disable: false };
        }
      })
    );

    res.status(200).json(newStudents);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  let updatedData = req.body;

  try {
    const student = await Student.findById(id);
    const existingAdmin = await Admin.findOne({ email: updatedData.email });
    const existingStudent = await Student.findOne({ email: updatedData.email });
    const existingTeacher = await Teacher.findOne({ email: updatedData.email });

    if (
      (existingStudent && existingStudent._id != id) ||
      existingAdmin ||
      existingTeacher
    ) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    if (updatedData.password && updatedData.password.length > 5) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData.password = hashedPassword;
    } else {
      delete updatedData.password;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("courses.course");

    if (!updatedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    if (
      student.birthday.getDate() != updatedStudent.birthday.getDate() ||
      student.birthday.getMonth() != updatedStudent.birthday.getMonth()
    ) {
      createNotificationForBirthdayAtCreateAndUpdateStudent(updatedStudent);
    }

    if (student.status && !updatedStudent.status) {
      await Lesson.updateMany(
        {
          role: "main",
          "students.student": student._id,
        },
        {
          $pull: { students: { student: student._id } },
        }
      );
    }

    if (updatedStudent.courses.find((item) => item.lessonAmount < 1)) {
      createNotificationForOneStudentLessonsCount(updatedStudent);
    } else {
      deleteNotificationForOneStudentLessonCount(updatedStudent);
    }

    const updatedStudentObj = updatedStudent.toObject();
    updatedStudentObj.password = "";

    res.status(200).json(updatedStudentObj);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ key: "student-not-found" });
    }

    const studentLessonCount = await Lesson.countDocuments({
      "students.student": id,
    });
    if (studentLessonCount > 0) {
      await Student.findByIdAndUpdate(id, { deleted: true });
      return res.status(200).json({ message: "Student successfully deleted" });
    }

    await Student.findByIdAndDelete(id);

    res.status(200).json({ message: "Student successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student password
export const updateStudentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "student-not-found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      student.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    const cleanedUpdatedStudent = updatedStudent.toObject();
    cleanedUpdatedStudent.password = "";

    res.status(200).json(cleanedUpdatedStudent);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Student lesson amount
export const decrementLessonAmount = async (lesson) => {
  try {
    const studentsIds = lesson.students
      .filter((item) => item.attendance !== 2)
      .map((item) => item.student._id);

    await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "courses.course": { $ne: lesson.course._id },
      },
      { $addToSet: { courses: { course: lesson.course._id, lessonAmount: 0 } } }
    );

    const updatedStudent = await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "courses.course": lesson.course._id,
      },
      { $inc: { "courses.$.lessonAmount": -1 } }
    );

    console.log(updatedStudent);

    if (!updatedStudent.acknowledged || updatedStudent.modifiedCount < 1) {
      return false;
    }

    const targetStudents = await Student.find({
      _id: { $in: studentsIds },
    });

    createNotificationForLessonsCount(targetStudents);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const incrementLessonAmount = async (lesson) => {
  try {
    const studentsIds = lesson.students
      .filter((item) => item.attendance !== 2)
      .map((item) => item.student._id);

    await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "courses.course": { $ne: lesson.course._id },
      },
      { $addToSet: { courses: { course: lesson.course._id, lessonAmount: 0 } } }
    );

    const updatedStudent = await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "courses.course": lesson.course._id,
      },
      { $inc: { "courses.$.lessonAmount": 1 } }
    );

    if (
      !updatedStudent.acknowledged ||
      updatedStudent.modifiedCount < studentsIds.length
    ) {
      return false;
    }

    const targetStudents = await Student.find({
      _id: { $in: studentsIds },
    });

    deleteNotificationForLessonCount(targetStudents);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
