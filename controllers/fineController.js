import { calcDate } from "../calculate/calculateDate.js";
import { Fine } from "../models/fineModel.js";
import { Teacher } from "../models/teacherModel.js";

// Create

export const createFine = async (req, res) => {
  try {
    const fine = await Fine.create(req.body);

    const fineCount = await Fine.countDocuments();
    const lastPage = Math.ceil(fineCount / 10);

    res.status(201).json({ fine, lastPage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get
export const getFinesWithPagination = async (req, res) => {
  const { searchQuery, startDate, endDate, fineType } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let fines;
    const filterObj = {};

    if (startDate && endDate) {
      const targetDate = calcDate(null, startDate, endDate);

      filterObj.createdAt = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    if (fineType) {
      filterObj.fineType = fineType;
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
      }).select("_id");

      const teachersIds = teachers.map((teacher) => teacher._id);
      const finesCount = await Fine.countDocuments({
        teacherId: { $in: teachersIds },
        ...filterObj,
      });

      fines = await Fine.find({
        teacher: { $in: teachersIds },
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");

      totalPages = Math.ceil(finesCount / limit);
    } else {
      const finesCount = await Fine.countDocuments(filterObj);
      totalPages = Math.ceil(finesCount / limit);
      fines = await Fine.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");
    }

    res.status(200).json({ fines, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getFinesForTeacher = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { id } = req.user;

  try {
    const filterObj = {
      teacher: id,
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
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      const targetDate = new Date();
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      filterObj.$expr = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, targetYear] },
          { $eq: [{ $month: "$createdAt" }, targetMonth] },
        ],
      };
    }

    const fines = await Fine.find(filterObj);

    res.status(200).json(fines);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// UPDATE
export const updateFine = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedFine = await Fine.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedFine) {
      return res.status(404).json({ key: "fine-not-found" });
    }

    res.status(200).json(updatedFine);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete
export const deleteFine = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFine = await Fine.findByIdAndDelete(id);

    if (!deletedFine) {
      return res.status(404).json({ key: "fine-not-found" });
    }

    res.status(200).json({ message: "Fine successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
