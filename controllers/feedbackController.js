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

    console.log({ message: "feedback created succuessfully" });
  } catch (err) {
    console.log({ message: err.message});
  }
};

// GET

export const getFeedbacksWithPagination = async (req, res) => {
  const { searchQuery, startDate, endDate, from } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let feedbacks;
    const filterObj = {
      from,
    };

    if (startDate && endDate) {
      const targetStartDate = new Date(startDate);
      const targetEndDate = new Date(endDate);
      targetStartDate.setHours(0, 0, 0, 0);
      targetEndDate.setHours(23, 59, 59, 999);
      filterObj.date = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      if (from === "teacher") {
        const teachers = await Teacher.find({
          fullName: { $regex: regexSearchQuery },
          deleted: false,
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
          .limit(limit);

        totalPages = Math.ceil(feedbackCount / limit);
      } else if (from === "student") {
        const students = await Student.find({
          fullName: { $regex: regexSearchQuery },
          deleted: false,
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
          .limit(limit);

        totalPages = Math.ceil(feedbackCount / limit);
      }
    } else {
      const feedbackCount = await Feedback.countDocuments(filterObj);
      totalPages = Math.ceil(feedbackCount / limit);
      feedbacks = await Feedback.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.status(200).json({ feedbacks, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getFeedbacksForTeacher = async (req, res) => {
  const { startDate, endDate, searchQuery } = req.query;

  try {
    const filterObj = {
      from: "teacher",
    };

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const studens = await Student.find({
        fullName: { $regex: regexSearchQuery },
        deleted: false,
      }).select("_id");

      const studentsIds = studens.map((student) => student._id);

      feedbacks = await Feedback.find({
        student: { $in: studentsIds },
        ...filterObj,
      });
    }

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
    const updatedFeedback = await Feedback.findByIdAndUpdate(id, req.body);

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
    const updatedFeedback = await Feedback.findByIdAndUpdate(feedback._id, feedback);

    if (!updatedFeedback) {
     throw new Error("feedback not found")
    }
  } catch (err) {
   console.log({ message: err.message});
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


export const deleteFeedbackByStudent = async (id)=>{
  try {
    const deletedFeedback=  await Feedback.findByIdAndDelete(id)

    if(!deleteFeedback){
      throw new Error("feedback not found")
    }
    
  } catch (err) {

    console.log({message: err.message})
    
  }
}