import { Course } from "../models/courseModel.js";

// Get courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
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

      const allCourses = await Course.find({
        name: { $regex: regexSearchQuery },
      });

      courses = await Course.find({
        name: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPages = Math.ceil(allCourses.length / limit);
    } else {
      const courseCount = await Course.countDocuments();
      totalPages = Math.ceil(courseCount / limit);
      courses = await Course.find()
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.status(200).json({ courses, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create course
export const createCourse = async (req, res) => {
  const { name } = req.body;
  try {
    const existingCourse = await Course.findOne({ name });
    if (existingCourse) {
      return res.status(409).json({ key: "course-already-exists" });
    }

    const newCourse = new Course(req.body);
    await newCourse.save();

    const coursesCount = await Course.countDocuments();
    const lastPage = Math.ceil(coursesCount / 10);

    res.status(201).json({ course: newCourse, lastPage });
  } catch (err) {
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
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete class

export const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Class successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
