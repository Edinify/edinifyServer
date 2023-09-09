import { Course } from "../models/courseModel.js";

// Get courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    console.log("salam");
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
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (err) {
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
    res.status(500).json({ message: { error: err.message } });
  }
};
