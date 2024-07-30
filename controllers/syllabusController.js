import logger from "../config/logger.js";
import { Syllabus } from "../models/syllabusModel.js";

// Get syllabus
export const getSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.find();

    res.status(200).json(syllabus);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET SYLLABUS",
      user: req.user,
      functionName: getSyllabus.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get syllabus for pagination
export const getSyllabusForPagination = async (req, res) => {
  const { courseId, searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let syllabus;

    if (!courseId) {
      return res
        .status(400)
        .json({ key: "course-required", message: "course id invalid" });
    }

    if (searchQuery) {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const SyllabusCount = await Syllabus.countDocuments({
        courseId: courseId,
        name: { $regex: regexSearchQuery },
      });

      syllabus = await Syllabus.find({
        courseId: courseId,
        name: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ orderNumber: 1 });

      totalPages = Math.ceil(SyllabusCount / limit);
    } else {
      const syllabusCount = await Syllabus.countDocuments({ courseId });

      totalPages = Math.ceil(syllabusCount / limit);
      syllabus = await Syllabus.find({ courseId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ orderNumber: 1 });
    }

    res.status(200).json({ syllabus, totalPages, currentPage: page });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET SYLLABUS FOR PAGINATION",
      user: req.user,
      functionName: getSyllabusForPagination.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create syllabus
export const createSyllabus = async (req, res, next) => {
  const { orderNumber, courseId } = req.body;

  try {
    if (orderNumber < 1)
      return res.status(400).json({ key: "invalid-order-number" });

    const existingOrderNumber = await Syllabus.findOne({
      orderNumber,
      courseId,
    });

    if (existingOrderNumber) {
      await Syllabus.updateMany(
        {
          courseId,
          orderNumber: { $gte: orderNumber },
        },
        { $inc: { orderNumber: 1 } }
      );
    } else {
      const syllabusCount = await Syllabus.countDocuments({ courseId });
      req.body = { ...req.body, orderNumber: syllabusCount + 1 };
    }

    const newSyllabus = new Syllabus(req.body);
    await newSyllabus.save();

    const page = Math.ceil(req.body.orderNumber / 10);

    req.query = { courseId, page, searchQuery: "" };

    next();
  } catch (err) {
    console.log(err.message);
    logger.error({
      method: "CREATE",
      status: 500,
      message: err.message,
      for: "CREATE COURSE",
      user: req.user,
      postedData: req.body,
      functionName: createSyllabus.name,
    });
    res.status(500).json({ error: err.message });
  }
};

// Update syllabus
export const updateSyllabus = async (req, res, next) => {
  const { id } = req.params;
  const { orderNumber, courseId } = req.body;

  try {
    if (orderNumber < 1)
      return res.status(400).json({ key: "invalid-order-number" });

    const existingOrderNumber = await Syllabus.findOne({
      orderNumber,
      courseId,
      _id: { $ne: id },
    });
    const oldSyllabus = await Syllabus.findById(id);

    if (existingOrderNumber) {
      const oldOrderNumber = oldSyllabus.orderNumber;

      if (oldOrderNumber < orderNumber) {
        await Syllabus.updateMany(
          {
            courseId,
            orderNumber: {
              $gt: oldSyllabus.orderNumber,
              $lte: orderNumber,
            },
          },
          { $inc: { orderNumber: -1 } }
        );
      } else if (oldOrderNumber > orderNumber) {
        await Syllabus.updateMany(
          {
            courseId,
            orderNumber: {
              $gte: orderNumber,
              $lt: oldSyllabus.orderNumber,
            },
          },
          { $inc: { orderNumber: 1 } }
        );
      }
    } else if (oldSyllabus.orderNumber != orderNumber) {
      await Syllabus.updateMany(
        {
          courseId,
          orderNumber: {
            $gt: oldSyllabus.orderNumber,
          },
        },
        { $inc: { orderNumber: -1 } }
      );
      const syllabusCount = await Syllabus.countDocuments({ courseId });
      req.body = { ...req.body, orderNumber: syllabusCount };
    }

    const updatedSyllabus = await Syllabus.findByIdAndUpdate(id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedSyllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const page = Math.ceil(updatedSyllabus.orderNumber / 10);

    req.query = { page, searchQuery: "", courseId: updatedSyllabus.courseId };

    console.log(updatedSyllabus);
    next();
  } catch (err) {
    console.log(err);
    logger.error({
      method: "PATCH",
      status: 500,
      message: err.message,
      for: "UPDATE COURSE",
      user: req.user,
      updatedData: req.body,
      courseId: id,
      functionName: updateSyllabus.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete syllabus
export const deleteSyllabus = async (req, res, next) => {
  const { id } = req.params;

  try {
    const deletedSyllabus = await Syllabus.findByIdAndRemove(id);

    if (!deletedSyllabus) {
      return res.status(404).json({ message: "syllabus not found" });
    }

    await Syllabus.updateMany(
      {
        courseId: deletedSyllabus.courseId,
        orderNumber: { $gt: deletedSyllabus.orderNumber },
      },
      { $inc: { orderNumber: -1 } }
    );

    req.query = { ...req.query, courseId: deletedSyllabus.courseId };

    next();
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      for: "DELETE COURSE",
      user: req.user,
      courseId: id,
      functionName: deleteSyllabus.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};
