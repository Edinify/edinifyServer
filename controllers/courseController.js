import logger from "../config/logger.js";
import { Course } from "../models/courseModel.js";

// Get courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();

    res.status(200).json(courses);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET COURSES",
      user: req.user,
      functionName: getCourses.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get courses for pagination
export const getCoursesForPagination = async (req, res) => {
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let courses;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const coursesCount = await Course.countDocuments({
        name: { $regex: regexSearchQuery },
        deleted: false,
      });

      courses = await Course.find({
        name: { $regex: regexSearchQuery },
        deleted: false,
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPages = Math.ceil(coursesCount / limit);
    } else {
      const coursesCount = await Course.countDocuments({ deleted: false });
      totalPages = Math.ceil(coursesCount / limit);
      courses = await Course.find({ deleted: false })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.status(200).json({ courses, totalPages });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET COURSES FOR PAGINATION",
      user: req.user,
      functionName: getCoursesForPagination.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create course
export const createCourse = async (req, res) => {
  const { name } = req.body;

  try {
    const existingCourse = await Course.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingCourse && !existingCourse.deleted) {
      return res.status(409).json({ key: "course-already-exists" });
    }

    if (existingCourse && existingCourse.deleted) {
      const newCourse = await Course.findByIdAndUpdate(existingCourse._id, {
        deleted: false,
      });
      const courses = await Course.find({ deleted: false });

      const index =
        courses.findIndex(
          (obj) => obj._id.toString() == existingCourse._id.toString()
        ) + 1;
      const lastPage = Math.ceil(index / 10);

      console.log(index, lastPage);

      return res.status(201).json({ course: newCourse, lastPage });
    }

    const newCourse = new Course(req.body);
    await newCourse.save();

    const coursesCount = await Course.countDocuments({ deleted: false });
    const lastPage = Math.ceil(coursesCount / 10);

    res.status(201).json({ course: newCourse, lastPage });
  } catch (err) {
    logger.error({
      method: "CREATE",
      status: 500,
      message: err.message,
      for: "CREATE COURSE",
      user: req.user,
      postedData: req.body,
      functionName: createCourse.name,
    });
    res.status(500).json({ error: err.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const existingCourse = await Course.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingCourse && existingCourse._id != id) {
      return res.status(409).json({ key: "course-already-exists" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
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
      functionName: updateCourse.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }

    await Course.findByIdAndUpdate(id, { deleted: true });

    res.status(200).json({ message: "course successfully deleted" });
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      for: "DELETE COURSE",
      user: req.user,
      courseId: id,
      functionName: deleteCourse.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};
