import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Feedback } from "../models/feedbackModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";

// CREATE

export const createFeedbackByTeacher = async (req, res) => {
  try {
    const feedback = await Feedback.create({ ...req.body, from: "teacher" });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const createFeedbackByStudent = async (feedback) => {
  try {
    await Feedback.create(feedback);

    // console.log({ message: "feedback created succuessfully" });
  } catch (err) {
    // console.log({ message: err.message });
  }
};

// GET

export const getFeedbacksWithPagination = async (req, res) => {
  const { searchQuery, startDate, endDate, from } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let targetDate;
    let totalPages;
    let feedbacks;
    const filterObj = {
      from,
    };

    if (startDate && endDate) {
      targetDate = calcDate(null, startDate, endDate);
    } else {
      targetDate = calcDateWithMonthly();
    }

    filterObj.createdAt = {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    };

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      if (from === "teacher") {
        const teachers = await Teacher.find({
          fullName: { $regex: regexSearchQuery },
        }).select("_id");

        const teachersIds = teachers.map((teacher) => teacher._id);
        const feedbackCount = await Feedback.countDocuments({
          teacher: { $in: teachersIds },
          ...filterObj,
        });

        feedbacks = await Feedback.find({
          teacher: { $in: teachersIds },
          ...filterObj,
        })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("teacher student");

        totalPages = Math.ceil(feedbackCount / limit);
      } else if (from === "student") {
        const students = await Student.find({
          fullName: { $regex: regexSearchQuery },
        }).select("_id");

        const studentsIds = students.map((student) => student._id);
        const feedbackCount = await Feedback.countDocuments({
          student: { $in: studentsIds },
          ...filterObj,
        });

        feedbacks = await Feedback.find({
          student: { $in: studentsIds },
          ...filterObj,
        })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("teacher student");

        totalPages = Math.ceil(feedbackCount / limit);
      }
    } else {
      const feedbackCount = await Feedback.countDocuments(filterObj);
      totalPages = Math.ceil(feedbackCount / limit);
      feedbacks = await Feedback.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher student");
    }

    res.status(200).json({ feedbacks, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getFeedbacksForTeacher = async (req, res) => {
  const { monthCount, startDate, endDate, searchQuery } = req.query;

  try {
    const targetDate = calcDate(monthCount, startDate, endDate);
    const filterObj = {
      from: "teacher",
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    };

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const studens = await Student.find({
        fullName: { $regex: regexSearchQuery },
      }).select("_id");

      const studentsIds = studens.map((student) => student._id);

      filterObj.student = {
        $in: studentsIds,
      };
    }

    const feedbacks = await Feedback.find(filterObj);

    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// UPDATE

export const updateFeedbackByTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedFeedback) {
      return res.status(404).json({ key: "feedback-not-found" });
    }

    res.status(200).json({ feedback: updatedFeedback });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateFeedbackByStudent = async (feedback) => {
  try {
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedback._id,
      feedback,
      { new: true }
    );

    if (!updatedFeedback) {
      throw new Error("feedback not found");
    }
  } catch (err) {
    // console.log({ message: err.message });
  }
};

// DELETE

export const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({ key: "feedback-not-found" });
    }

    res.status(200).json({ feedback: deletedFeedback });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const deleteFeedbackByStudent = async (id) => {
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(id);

    if (!deletedFeedback) {
      throw new Error("feedback not found");
    }
  } catch (err) {
    // console.log({ message: err.message });
  }
};
