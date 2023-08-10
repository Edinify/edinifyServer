import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import bcrypt from "bcrypt";
import { createNotificationForLessonsCount } from "./notificationController.js";

// Get students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("courses");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students for pagination
export const getStudentsForPagination = async (req, res) => {
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let students;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const allStudents = await Student.find({
        fullName: { $regex: regexSearchQuery },
      });

      students = await Student.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");

      totalPages = Math.ceil(allStudents.length / limit);
    } else {
      const studentCount = await Student.countDocuments();
      totalPages = Math.ceil(studentCount / limit);
      students = await Student.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");
    }

    res.status(200).json({ students, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get Student
export const getStudent = async (req, res) => {
  const { id } = req.user;
  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students by course id
export const getStudentsByCourseId = async (req, res) => {
  const { courseId, day, time, role, date } = req.query;

  try {
    const students = await Student.find({
      courses: courseId,
      lessonAmount: { $gt: 0 },
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
        } else if (role === "current") {
          checkStudent = await Lesson.findOne({
            "students.student": student._id,
            day: day,
            time: time,
            role: role,
            date: date,
            status: {
              $in: ["unviewed", "confirmed"],
            },
          });
        }

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
    const existingStudent = await Student.findOne({ email: updatedData.email });

    if (existingStudent && existingStudent._id != id) {
      return res.status(400).json({ key: "email-already-exists" });
    }

    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData = { ...updatedData, password: hashedPassword };
    }

    const student = await Student.findById(id);

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("courses");

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.lessonAmount !== 0 && updatedStudent.lessonAmount === 0) {
      createNotificationForLessonsCount([updatedStudent]);
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

    res.status(200).json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete student

export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

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
      return res.status(404).json({ message: "Student not found." });
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
    delete cleanedUpdatedStudent.password;

    res.status(200).json(cleanedUpdatedStudent);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
