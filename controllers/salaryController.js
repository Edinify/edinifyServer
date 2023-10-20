import { calcDateWithMonthly } from "../calculate/calculateDate.js";
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
      };
    });

    await Salary.insertMany(salaries);

    console.log("success create salary with cron");
  } catch (err) {
    // console.log(err);
  }
};

// Create a salary at create teacher
export const createSalaryWhenCreateTeacher = async (teacher) => {
  try {
    const newSalary = await Salary.create({
      teacherId: teacher._id,
      teacherSalary: teacher.salary,
    });
    console.log("success");
  } catch (err) {
    // console.log(err);
  }
};

// Create a salary at create bonus
export const createSalaryWhenCreateBonus = async (teacher) => {
  try {
    const newSalary = await Salary.create({
      teacherId: teacher._id,
      teacherSalary: teacher.salary,
    });

    return newSalary;
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
    let updatedSalary;

    updatedSalary = await Salary.findOneAndUpdate(
      {
        teacherId: teacher._id,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      },
      { teacherSalary: teacher.salary },
      {
        new: true,
      }
    );

    if (!updatedSalary) {
      updatedSalary = await Salary.create({
        teacherId: teacher._id,
        teacherSalary: teacher.salary,
      });
    }

    return updatedSalary;
  } catch (err) {
    console.log(err);
  }
};

// Update Or Create salary when update bonus
export const updateOrCreateSalaryWhenCreateBonus = async (bonus) => {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth() + 1;

  try {
    let updatedSalary;

    updatedSalary = await Salary.findOneAndUpdate(
      {
        teacherId: bonus.teacher._id,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      },
      { bonus: bonus._id },
      {
        new: true,
      }
    );

    if (!updatedSalary) {
      console.log(bonus.teacher.salary);
      updatedSalary = await Salary.create({
        teacherId: bonus.teacher._id,
        bonus: bonus._id,
        teacherSalary: bonus.teacher.salary,
      });
      console.log(3);
      console.log(updatedSalary);
    }

    return updatedSalary;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// Update salary when update lesson
export const updateSalaryWhenUpdateLesson = async (lesson) => {
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
          (student) => student.attendance === 1 || student.attendance === -1
        ).length;
      }

      if (lesson.status === "cancelled") {
        cancelledCount++;
      }
    });

    let updatedSalary;

    updatedSalary = await Salary.findOneAndUpdate(
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
      },
      { new: true }
    );

    if (!updatedSalary) {
      updatedSalary = await Salary.create({
        teacherId: lesson.teacher._id,
        teacherSalary: lesson.teacher.salary,
        confirmedCount,
        cancelledCount,
        participantCount,
        date: lesson.date,
      });
    }

    return updatedSalary;
  } catch (err) {
    // console.log(err);
  }
};

// Get salaries
export const getSalariesForAdmins = async (req, res) => {
  const { startDate, endDate, searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let teachers;
    let totalPages;
    let salaries;
    let result;
    let filterObj = {};

    if (searchQuery && searchQuery.trim() !== "") {
      // console.log("check search");
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachersCount = await Teacher.countDocuments({
        fullName: { $regex: regexSearchQuery },
      });

      teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPages = Math.ceil(teachersCount / limit);
    } else {
      const teachersCount = await Teacher.countDocuments();

      totalPages = Math.ceil(teachersCount / limit);

      teachers = await Teacher.find()
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const teachersIds = teachers.map((teacher) => teacher._id);

    filterObj.teacherId = {
      $in: teachersIds,
    };

    if (startDate && endDate) {
      const targetStartDate = new Date(startDate);
      const targetEndDate = new Date(endDate);

      targetStartDate.setDate(1);
      targetEndDate.setMonth(targetEndDate.getMonth() + 1);
      targetEndDate.setDate(0);

      targetStartDate.setHours(0, 0, 0, 0);
      targetEndDate.setHours(23, 59, 59, 999);

      filterObj.date = {
        $gte: targetStartDate,
        $lte: targetEndDate,
      };
    } else {
      const targetDate = new Date();
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;

      filterObj.$expr = {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth] },
        ],
      };
    }

    salaries = await Salary.find(filterObj).populate("bonus");

    result = teachers.map((teacher) => {
      const targetSalaries = salaries.filter(
        (salary) => salary.teacherId.toString() === teacher._id.toString()
      );

      let totalConfirmed = 0;
      let totalCancelled = 0;
      let totalSalary = 0;
      let participantCount = 0;
      let totalBonus = 0;

      console.log(targetSalaries);

      targetSalaries.forEach((salary) => {
        totalConfirmed += salary.confirmedCount;
        totalCancelled += salary.cancelledCount;
        participantCount += salary.participantCount;
        totalBonus += salary.bonus?.amount || 0;

        if (salary.teacherSalary.monthly) {
          totalSalary += salary.teacherSalary.value;
        } else if (salary.teacherSalary.hourly) {
          totalSalary += salary.teacherSalary.value * salary.participantCount;
        }
      });

      return {
        _id: teacher._id,
        teacherName: teacher.fullName,
        salary: teacher.salary,
        totalSalary: totalSalary,
        confirmedCount: totalConfirmed,
        cancelledCount: totalCancelled,
        participantCount: participantCount,
        bonus: totalBonus,
      };
    });

    res.status(200).json({ salaries: result, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getSalariesForTeacher = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { id } = req.user;
  console.log(req.user);
  try {
    const targetDate = calcDateWithMonthly(startDate, endDate);

    const teacher = await Teacher.findById(id);
    let salaries;
    let filterObj = {
      teacherId: id,
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    };

    salaries = await Salary.find(filterObj).populate("bonus");

    let totalSalary = 0;
    let participantCount = 0;
    let totalBonus = 0;

    salaries.forEach((salary) => {
      participantCount += salary.participantCount;
      // bonus da id gelirdi
      totalBonus += (salary.bonus !== null && salary.bonus.amount) || 0;
      console.log(salary);
      if (salary.teacherSalary.monthly) {
        totalSalary += salary.teacherSalary.value;
      } else if (salary.teacherSalary.hourly) {
        totalSalary += salary.teacherSalary.value * salary.participantCount;
      }
    });

    const result = {
      _id: id,
      salary: teacher.salary,
      totalSalary: totalSalary,
      participantCount: participantCount,
      bonus: totalBonus,
    };

    res.status(200).json({ salary: result });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
