import { Lesson } from "../models/lessonModel.js";
import { Salary } from "../models/salaryModel.js";
import { Teacher } from "../models/teacherModel.js";

// CREATE SALARY
// Create salaries at the beginning of each month
export const createSalariesAtEachMonth = async () => {
  try {
    const teachers = await Teacher.find({
      deleted: false,
      status: true,
    });

    const salaries = teachers.map((teacher) => {
      return {
        teacherId: teacher._id,
        teacherSalary: teacher.salary,
        confirmedCount: 0,
        cancelledCount: 0,
        participantCount: 0,
      };
    });

    await Salary.insertMany(salaries);
  } catch (err) {
    console.log(err);
  }
};

// Create a salary at create teacher
export const createSalaryWhenCreateTeacher = async (teacher) => {
  try {
    await Salary.create({
      teacherId: teacher._id,
      teacherSalary: teacher.salary,
      confirmedCount: 0,
      cancelledCount: 0,
      participantCount: 0,
    });
    console.log("success");
  } catch (err) {
    console.log(err);
  }
};

// UPDATE SALARY
// Update salary when update teacher
export const updateSalaryWhenUpdateTeacher = async (teacher) => {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth() + 1;

  try {
    await Salary.findOneAndUpdate(
      {
        teacherId: teacher._id,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      },
      { teacherSalary: teacher.salary }
    );
  } catch (err) {
    console.log(err);
  }
};

// Update salary when update lesson
export const updateSalaryWhenUpdateSalary = async (lesson) => {
  const targetDate = new Date(lesson.date);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;
  try {
    let confirmedCount = 0;
    let cancelledCount = 0;
    let participantCount = 0;

    const lessons = await Lesson.find({
      teacher: lesson.teacher._id,
      role: "current",
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth] },
        ],
      },
    });

    lessons.forEach((lesson) => {
      if (lesson.status === "confirmed") {
        confirmedCount++;
        participantCount += lesson.students.filter(
          (student) => student.attendance === 1
        ).length;
      }

      if (lesson.status === "cancelled") {
        cancelledCount++;
      }
    });

    await Salary.findOneAndUpdate(
      {
        teacherId: lesson.teacher._id,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      },
      {
        confirmedCount,
        cancelledCount,
        participantCount,
      }
    );
  } catch (err) {
    console.log(err);
  }
};

// Get salaries
export const getSalaries = async (req, res) => {
  const { teacherId, startDate, endDate, searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const filterObj = {
    status: { $ne: "unviewed" },
    role: "current",
  };

  if (teacherId) {
    filterObj.teacher = teacherId;
  }
  if (startDate && endDate) {
    filterObj.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    const startOfMonth = new Date();
    const endOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    filterObj.date = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };
  }

  try {
    const lessons = await Lesson.find(filterObj);
    let teachers;
    let totalPage;

    if (teacherId) {
      teachers = await Teacher.find({ _id: teacherId });
      totalPage = 1;
    } else {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachersCount = await Teacher.countDocuments({
        fullName: { $regex: regexSearchQuery },
      });

      teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPage = Math.ceil(teachersCount / limit);
    }

    const response = teachers.map((teacher) => {
      const teacherLessons = lessons.filter(
        (lesson) => lesson.teacher.toString() == teacher._id.toString()
      );

      const confirmed = teacherLessons.filter(
        (lesson) => lesson.status === "confirmed"
      );

      const cancelled = teacherLessons.filter(
        (lesson) => lesson.status === "cancelled"
      );

      const participantCount = confirmed.reduce((total, current) => {
        return (total += current.students.filter(
          (item) => item.attendance === 1
        ).length);
      }, 0);

      const total = confirmed.reduce(
        (total, current) =>
          (total +=
            current.students.filter((item) => item.attendance === 1).length *
            current.salary),
        0
      );

      return {
        teacher,
        confirmed: confirmed.length,
        cancelled: cancelled.length,
        participantCount,
        salary: teacher.salary,
        total: total,
      };
    });

    res.status(200).json({ salariesData: response, totalPage });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
