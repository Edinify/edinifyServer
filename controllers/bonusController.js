import { Bonus } from "../models/bonusModel.js";
import { Salary } from "../models/salaryModel.js";
import { Teacher } from "../models/teacherModel.js";
import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { checkAdmin } from "../middleware/auth.js";

// Create

export const createBonus = async (req, res) => {
  const { teacher } = req.body;
  const targetDate = new Date();
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;

  try {
    const existingBonus = await Bonus.findOne({
      teacher,
      $expr: {
        $and: [
          { $eq: [{ $year: "$createdAt" }, targetYear] },
          { $eq: [{ $month: "$createdAt" }, targetMonth] },
        ],
      },
    });

    if (existingBonus) {
      return res.status(409).json({ key: "bonus-already-exist" });
    }

    const bonus = await Bonus.create(req.body);

    const updatedSalary = await Salary.findOneAndUpdate(
      {
        teacherId: teacher,
        $expr: {
          $and: [
            { $eq: [{ $year: "$date" }, targetYear] },
            { $eq: [{ $month: "$date" }, targetMonth] },
          ],
        },
      },
      {
        bonus: bonus._id,
      },
      { new: true }
    );

    if (!updatedSalary) {
      await Bonus.findByIdAndDelete(bonus._id);
      return res.status(500).json({ key: "create-error-occurred" });
    }

    const bonusCount = await Bonus.countDocuments();
    const lastPage = Math.ceil(bonusCount / 10);

    res.status(201).json({ bonus, lastPage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get
export const getBonusesWithPagination = async (req, res) => {
  const { searchQuery, startDate, endDate } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let targetDate;
    let totalPages;
    let bonuses;
    const filterObj = {};

    if (startDate && endDate) {
      targetDate = calcDate(null, startDate, endDate);
    } else {
      targetDate = calcDateWithMonthly(new Date(), new Date());
    }

    filterObj.createdAt = {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    };

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
      }).select("_id");

      const teachersIds = teachers.map((teacher) => teacher._id);

      const bonusesCount = await Bonus.countDocuments({
        teacher: { $in: teachersIds },
        ...filterObj,
      });

      bonuses = await Bonus.find({
        teacher: { $in: teachersIds },
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");

      totalPages = Math.ceil(bonusesCount / limit);
    } else {
      const bonusesCount = await Bonus.countDocuments(filterObj);
      totalPages = Math.ceil(bonusesCount / limit);
      bonuses = await Bonus.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");
    }

    res.status(200).json({ bonuses, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getBonusesForTeacher = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const { id } = req.user;
  // console.log(req.query);
  try {
    let targetDate;
    if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    } else {
      targetDate = calcDate(monthCount || 1);
    }

    const filterObj = {
      teacher: id,
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    };

    const bonuses = await Bonus.find(filterObj);

    res.status(200).json(bonuses);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// UPDATE
export const updateBonus = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedBonus = await Bonus.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("teacher");

    if (!updatedBonus) {
      return res.status(404).json({ key: "bonus-not-found" });
    }

    res.status(200).json(updatedBonus);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete
export const deleteBonus = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedBonus = await Bonus.findByIdAndDelete(id);

    if (!deletedBonus) {
      return res.status(404).json({ key: "bonus-not-found" });
    }

    res.status(200).json({ message: "Bonus successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
