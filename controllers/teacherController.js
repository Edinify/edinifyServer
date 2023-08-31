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

      const teachersCount = await Teacher.countDocuments({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
      });

      teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");

      totalPages = Math.ceil(teachersCount / limit);
    } else {
      const teachersCount = await Teacher.countDocuments({ deleted: false });
      totalPages = Math.ceil(teachersCount / limit);

      teachers = await Teacher.find({ deleted: false })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");
    }

    const teacherList = teachers.map((teacher) => ({
      ...teacher.toObject(),
      password: "",
    }));

    res.status(200).json({ teachers: teacherList, totalPages });
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

    if (updatedData.password && updatedData.password.length > 5) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData = { ...updatedData, password: hashedPassword };
    } else {
      delete updatedData.password;
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

    const updatedTeacherObj = updatedTeacher.toObject();
    updatedTeacherObj.password = "";

    res.status(200).json(updatedTeacherObj);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacherLessonsCount = await Lesson.countDocuments({
      teacher: id,
    });
    if (teacherLessonsCount > 0) {
      await Teacher.findByIdAndUpdate(id, { deleted: true });
      res.status(200).json({ message: "Teacher successfully deleted" });
    }

    await Teacher.findByIdAndDelete(id);

    res.status(200).json({ message: "Teacher successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

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
