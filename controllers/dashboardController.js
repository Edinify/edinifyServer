import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Course } from "../models/courseModel.js";
import { Earning } from "../models/earningsModel.js";
import { Expense } from "../models/expenseModel.js";
import { Income } from "../models/incomeModel.js";
import { Leaderboard } from "../models/leaderboardModel.js";
import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";

export const getConfirmedLessonsCount = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    const confirmedCount = await Lesson.countDocuments({
      status: "confirmed",
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

export const getCancelledLessonsCount = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const cancelledCount = await Lesson.countDocuments({
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

export const getUnviewedLessons = async (req, res) => {
  try {
    const result = [];

    const unviewedLessons = await Lesson.find({
      status: "unviewed",
    }).populate("teacher course students.student");

    unviewedLessons.forEach((lesson) => {
      const checkTeacher = result.find(
        (item) =>
          item?.teacher?._id.toString() === lesson.teacher._id.toString()
      );

      if (checkTeacher) {
        checkTeacher.lessons?.push(lesson);
      } else {
        result.push({
          teacher: lesson.teacher,
          lessons: [lesson],
        });
      }
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getFinance = async (req, res) => {
  const targetDate = calcDate(1);
  try {
    const incomes = await Income.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const expenses = await Expense.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const earnings = await Earning.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const totalIncome = incomes.reduce(
      (total, income) => (total += income.amount),
      0
    );

    const totalExpense = expenses.reduce(
      (total, expense) => (total += expense.amount),
      0
    );

    const totalEarnings = earnings.reduce(
      (total, curr) => (total += curr.earnings),
      0
    );

    const turnover =
      totalIncome > totalEarnings ? totalEarnings : totalIncome - totalEarnings;

    const profit = turnover - totalExpense;

    const result = {
      income: totalIncome,
      expense: totalExpense,
      turnover: turnover,
      profit: profit,
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getCoursesStatistics = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const students = await Student.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });
    const courses = await Course.find();

    const result = courses.map((course) => {
      const courseStatistic = students.filter((student) => {
        const coursesIds = student.courses.map((item) => item.course) || [];

        return coursesIds.find(
          (item) => item?.toString() === course._id?.toString()
        );
      });

      return { courseName: course.name, value: courseStatistic.length };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAdvertisingStatistics = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);
  try {
    const students = await Student.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });
    const advertisings = [
      "instagram",
      "referral",
      "event",
      "externalAds",
      "other",
    ];

    const result = advertisings.map((advertising) => {
      const advertisingStatistics = students.filter(
        (student) => student.whereComing === advertising
      );

      return {
        name: advertising,
        value: (advertisingStatistics.length * 100) / students.length,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getTachersResults = async (req, res) => {
  const { monthCount, startDate, endDate, byFilter } = req.query;

  console.log(startDate, endDate);
  let targetDate;
  try {
    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
      console.log(targetDate);
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
    console.log(1);

    let index;
    if (byFilter === "lessonCount") {
      teachersResultsList.sort((a, b) => b.lessonCount - a.lessonCount);
      index =
        teachersResultsList[2].lessonCount > 0
          ? 3
          : teachersResultsList[1].lessonCount > 0
          ? 2
          : teachersResultsList[0].lessonCount > 0
          ? 1
          : 0;
    } else if (byFilter === "starCount") {
      teachersResultsList.sort((a, b) => b.starCount - a.starCount);
      index =
        teachersResultsList[2].starCount > 0
          ? 3
          : teachersResultsList[1].starCount > 0
          ? 2
          : teachersResultsList[0].starCount > 0
          ? 1
          : 0;
    }
    console.log(index);

    const result = {
      leaderTeacher: [...teachersResultsList.splice(0, index)],
      otherTeacher: [...teachersResultsList.splice(index)],
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
