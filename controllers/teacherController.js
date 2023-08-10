import { Lesson } from "../models/lessonModel.js";
import { Teacher } from "../models/teacherModel.js";
import bcrypt from "bcrypt";

// Get teachers
export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate("courses");
    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get teacher for pagination
export const getTeachersForPagination = async (req, res) => {
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let teachers;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const allTeachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
      });

      teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");

      totalPages = Math.ceil(allTeachers.length / limit);
    } else {
      const teacherCount = await Teacher.countDocuments();
      totalPages = Math.ceil(teacherCount / limit);
      teachers = await Teacher.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");
    }

    res.status(200).json({ teachers, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get Teacher
export const getTeacher = async (req, res) => {
  const { id } = req.user;
  try {
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(teacher);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update teacher
export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  let updatedData = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ email: updatedData.email });

    if (existingTeacher && existingTeacher._id != id) {
      return res.status(400).json({ key: "email-already-exists" });
    }

    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData = { ...updatedData, password: hashedPassword };
    }

    const teacher = await Teacher.findById(id);

    const updatedTeacher = await Teacher.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("courses");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (teacher.status && !updatedTeacher.status) {
      await Lesson.deleteMany({
        role: "main",
        teacher: teacher._id,
      });
    }

    res.status(200).json(updatedTeacher);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete teacher

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(id);

    if (!deletedTeacher) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
// fajk

// Update teacher password
export const updateTeacherPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({ message: "Student not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      teacher.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json(updatedTeacher);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
