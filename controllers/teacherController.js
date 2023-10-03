import { Lesson } from "../models/lessonModel.js";
import { Teacher } from "../models/teacherModel.js";
import bcrypt from "bcrypt";
import { updateSalaryWhenUpdateTeacher } from "./salaryController.js";
import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Leaderboard } from "../models/leaderboardModel.js";

// Get teachers

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("-password")
      .populate("courses");

    console.log("all teachers");

    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get active teachers
export const getActiveTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({
      deleted: false,
      status: true,
    })
      .select("-password")
      .populate("courses");

    console.log("active teachers");

    console.log(teachers);

    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get teacher for pagination
export const getTeachersForPagination = async (req, res) => {
  const { searchQuery, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let teachers;
    let filterObj = {};

    if (status === "active") filterObj.status = true;

    if (status === "deactive") filterObj.status = false;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachersCount = await Teacher.countDocuments({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
        ...filterObj,
      });

      teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("courses");

      totalPages = Math.ceil(teachersCount / limit);
    } else {
      const teachersCount = await Teacher.countDocuments({
        deleted: false,
        ...filterObj,
      });
      totalPages = Math.ceil(teachersCount / limit);

      teachers = await Teacher.find({ deleted: false, ...filterObj })
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

    const updatedSalary = updateSalaryWhenUpdateTeacher(updatedTeacher);

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!updatedSalary) {
      await Teacher.findByIdAndUpdate(teacher);

      return res.status(400).json({ key: "create-error-occurred" });
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
      role: "current",
    });
    if (teacherLessonsCount > 0) {
      await Teacher.findByIdAndUpdate(id, { deleted: true });
    } else {
      await Teacher.findByIdAndDelete(id);
    }

    await Lesson.deleteMany({ teacher: id, role: "main" });

    res.status(200).json({ message: "Teacher successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update teacher password
export const updateTeacherPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;
  // console.log(req.body);
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

// Get teacher chart data

export const getTeacherChartData = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const months = [];
    const studentsCountList = [];
    const lessonsCountList = [];

    while (targetDate.startDate <= targetDate.endDate) {
      const targetYear = targetDate.startDate.getFullYear();
      const targetMonth = targetDate.startDate.getMonth() + 1;

      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
      }).format(targetDate.startDate);

      const lessons = await Lesson.find({
        status: "confirmed",
        role: "current",
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      });

      const totalStudentsCount = lessons.reduce(
        (total, lesson) =>
          (total += lesson.students.filter(
            (item) => item.attendance === 1
          ).length),
        0
      );

      months.push({
        month: monthName,
        year: targetYear,
      });
      lessonsCountList.push(lessons.length);
      studentsCountList.push(totalStudentsCount);

      targetDate.startDate.setMonth(targetDate.startDate.getMonth() + 1);
    }

    res.status(200).json({ months, studentsCountList, lessonsCountList });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get teacher confirmed lesson

export const getTeacherConfirmedLessonsCount = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const { id } = req.user;

  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const confirmedCount = await Lesson.countDocuments({
      teacher: id,
      status: "confirmed",
      role: "current",
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    res.status(200).json(confirmedCount);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getTeacherCancelledLessonsCount = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const { id } = req.user;

  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const cancelledCount = await Lesson.countDocuments({
      teacher: id,
      role: "current",
      status: "cancelled",
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    res.status(200).json(cancelledCount);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getTeacherUnviewedLessons = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const { id } = req.user;

  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const unviewedCount = await Lesson.countDocuments({
      teacher: id,
      role: "current",
      status: "unviewed",
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    res.status(200).json(unviewedCount);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getTeacherLeadboardOrder = async (req, res) => {
  const { monthCount, startDate, endDate, byFilter } = req.query;
  const { id } = req.user;

  let targetDate;
  try {
    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const teachers = await Teacher.find().select("_id fullName");
    const leaderboardData = await Leaderboard.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const teachersResultsList = teachers.map((teacher) => {
      const targetLeaderboardData = leaderboardData.filter(
        (item) => item.teacherId.toString() == teacher._id.toString()
      );

      const totalLessonCount = targetLeaderboardData.reduce(
        (total, item) => (total += item.lessonCount),
        0
      );

      const totalStarCount = targetLeaderboardData.reduce(
        (total, item) => (total += item.starCount),
        0
      );

      return {
        teacher,
        lessonCount: totalLessonCount,
        starCount: totalStarCount,
      };
    });

    if (byFilter === "lessonCount") {
      teachersResultsList.sort((a, b) => b.lessonCount - a.lessonCount);
    } else if (byFilter === "starCount") {
      teachersResultsList.sort((a, b) => b.starCount - a.starCount);
    }

    const teacherOrder =
      teachersResultsList.findIndex(
        (item) => item.teacher._id.toString() == id
      ) + 1;

    res.status(200).json({
      teacherOrder,
      teacherCount: teachersResultsList.length,
    });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
