import logger from "../config/logger.js";
import { Syllabus } from "../models/syllabusModel.js";

// Get syllabus
export const getSyllabus = async (req, res) => {
  try {
    const courses = await Syllabus.find();

    res.status(200).json(courses);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET COURSES",
      user: req.user,
      functionName: getSyllabus.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get syllabus for pagination
export const getSyllabusForPagination = async (req, res) => {
  const { courseId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  // console.log(req.query)
  try {
    let totalPages;
    let syllabus;

    if (courseId) {
      const regexSearchQuery = new RegExp(courseId, "i");

      const SyllabusCount = await Syllabus.countDocuments({
        courseId: courseId,
        deleted: false,
      });

      syllabus = await Syllabus.find({
        courseId: courseId,
      })
        .skip((page - 1) * limit)
        .limit(limit);

        // console.log(syllabus)
      totalPages = Math.ceil(SyllabusCount / limit);
    } else {
      const coursesCount = await Syllabus.countDocuments({ deleted: false });
      // totalPages = Math.ceil(coursesCount / limit);
      // syllabus = await Syllabus.find({ deleted: false })
      //   .skip((page - 1) * limit)
      //   .limit(limit);
    }

    res.status(200).json({ syllabus, totalPages });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET COURSES FOR PAGINATION",
      user: req.user,
      functionName: getSyllabusForPagination.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create syllabus
export const createSyllabus = async (req, res) => {

  try {
    // const existingSyllabus = await Syllabus.findOne({
    //   name: { $regex: new RegExp(name, "i") },
    // });

    // console.log(req.body)
    // if (existingSyllabus) {
    //   return res.status(409).json({ key: "Syllabus-already-exists" });
    // }
    const newSyllabus = new Syllabus(req.body);
    await newSyllabus.save();

    const SyllabusCount = await Syllabus.countDocuments();
    const lastPage = Math.ceil(SyllabusCount / 10);

    res.status(201).json({ syllabus: newSyllabus, lastPage });
  } catch (err) {
    console.log(err.message)
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
export const updateSyllabus = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const existingCourse = await Syllabus.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingCourse && existingCourse._id != id) {
      return res.status(409).json({ key: "syllabus-already-exists" });
    }

    const updatedCourse = await Syllabus.findByIdAndUpdate(id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (err) {
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
export const deleteSyllabus = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Syllabus.findById(id);
    console.log(course)
    if (!course) {
      return res.status(404).json({ message: "syllabus not found" });
    }

    await Syllabus.findByIdAndRemove(id);

    res.status(200).json({ message: "syllabus successfully deleted" });
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
