import { Feedback } from "../models/feedbackModel.js";
import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import { createEarnings } from "./earningController.js";
import {
  createFeedbackByStudent,
  deleteFeedbackByStudent,
  updateFeedbackByStudent,
} from "./feedbackController.js";
import { createOrUpdaeteLeadboard } from "./leadboardController.js";
import {
  createNotificationForUpdate,
  deleteNotificationForUpdateTable,
} from "./notificationController.js";
import { updateSalaryWhenUpdateLesson } from "./salaryController.js";
import {
  decrementLessonAmount,
  incrementLessonAmount,
} from "./studentController.js";

// Create lesson
export const createLesson = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.body.teacher);

    const newLesson = new Lesson({
      ...req.body,
      salary: teacher.salary,
    });

    await newLesson.populate("teacher course students.student");

    await newLesson.save();

    if (newLesson.role === "current") {
      createNotificationForUpdate(newLesson.teacher._id, newLesson.students);
    }

    res.status(201).json(newLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get weekly lessons for main table
export const getWeeklyLessonsForMainTable = async (req, res) => {
  const { teacherId } = req.query;

  try {
    if (!teacherId || teacherId === "undefined") {
      return res.status(200).json([]);
    }

    const lessons = await Lesson.find({
      teacher: teacherId,
      role: "main",
    }).populate("teacher course students.student");

    res.status(200).json(lessons);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get weekly lessons for current table
export const getWeeklyLessonsForCurrentTable = async (req, res) => {
  const { teacherId } = req.query;

  const currentDate = new Date();
  const startWeek = new Date(
    currentDate.setDate(
      currentDate.getDate() -
        (currentDate.getDay() === 0 ? 7 : currentDate.getDay()) +
        1
    )
  );
  const endWeek = new Date(currentDate.setDate(currentDate.getDate() + 6));

  startWeek.setHours(0, 0, 0, 0);
  endWeek.setHours(23, 59, 59, 999);

  try {
    if (!teacherId || teacherId === "undefined") {
      return res.status(200).json([]);
    }

    const lessons = await Lesson.find({
      teacher: teacherId,
      role: "current",
      date: {
        $gte: startWeek,
        $lte: endWeek,
      },
    }).populate("teacher course students.student");

    res.status(200).json(lessons);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get weekly lessons for main panel
export const getWeeklyLessonsForMainPanel = async (req, res) => {
  const { startDate, endDate, teacherId, studentId, status, attendance } =
    req.query;
  const { role, id } = req.user;
  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  newStartDate.setHours(0, 0, 0, 0);
  newEndDate.setHours(23, 59, 59, 999);

  try {
    const filterObj = {
      role: "current",
    };

    if (role === "teacher") {
      filterObj.teacher = id;
    } else if (role === "student") {
      filterObj["students.student"] = id;
    } else if (teacherId) {
      filterObj.teacher = teacherId;
    } else if (studentId) {
      filterObj["students.student"] = studentId;
    }

    if (startDate && endDate) {
      filterObj.date = {
        $gte: newStartDate,
        $lte: newEndDate,
      };
    }

    if (status === "confirmed" || status === "cancelled") {
      filterObj.status = status;
    }

    if (attendance === "present") {
      filterObj.students = {
        $elemMatch: { student: studentId || id, attendance: 1 },
      };
    } else if (attendance === "absent") {
      filterObj.students = {
        $elemMatch: { student: studentId || id, attendance: -1 },
      };
    }

    let lessons;

    if (studentId || role === "student") {
      const filteredLessons = await Lesson.find(filterObj)
        .populate("teacher course students.student students.attendance")
        .select("day date time role status note task createdDate students");

      lessons = filteredLessons.map((lesson) => {
        return {
          ...lesson.toObject(),
          students: lesson.students.filter(
            (item) => item.student._id == (studentId || id)
          ),
        };
      });
    } else {
      lessons = await Lesson.find(filterObj).populate(
        "teacher course students.student"
      );
    }

    res.status(200).json(lessons);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update lesson in current and main table
export const updateLessonInTable = async (req, res) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findById(id).populate(
      "teacher students.student"
    );
    let newLesson = req.body;

    if (newLesson.teacher) {
      const teacher = await Teacher.findById(newLesson.teacher);
      newLesson.salary = teacher.salary;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(id, newLesson, {
      new: true,
    }).populate("teacher course students.student");

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const earnings = updatedLesson.students.reduce((total, curr) => {
      if (curr.attendance === 1) {
        return (total += curr.student.payment);
      } else {
        return total;
      }
    }, 0);

    updatedLesson.earnings = earnings;
    await updatedLesson.save();

    if (updatedLesson.role === "current") {
      if (lesson.students.length > updatedLesson.students.length) {
        createNotificationForUpdate(lesson.teacher._id, lesson.students);
      } else {
        createNotificationForUpdate(
          updatedLesson.teacher._id,
          updatedLesson.students
        );
      }
    }

    res.status(200).json(updatedLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update lesson in main panel
export const updateLessonInMainPanel = async (req, res) => {
  const { whoFor } = req.query;
  const { id } = req.params;
  const { role } = req.user;
  const feedback = req.body.students[0]?.feedback || "";
  const studentId = req.body.students[0]?.student;

  try {
    const lesson = await Lesson.findById(id);
    let newLesson = req.body;

    // Update lesson for one student
    if (role === "student" || whoFor === "student") {
      const checkFeedback = await Feedback.findOne({ lessonId: id });

      if (feedback) {
        if (!checkFeedback) {
          await createFeedbackByStudent({
            teacher: lesson.teacher,
            student: studentId,
            lessonId: lesson._id,
            feedback,
            from: "student",
          });
        } else if (checkFeedback.feedback !== feedback) {
          await updateFeedbackByStudent({
            ...checkFeedback.toObject(),
            feedback,
          });
        }
      } else if (checkFeedback) {
        await deleteFeedbackByStudent(checkFeedback._id);
      }

      const newFeedback = await Feedback.findOne({ lessonId: id });
      const newStudentInfo = req.body?.students[0];

      const updatedLesson = await Lesson.findOneAndUpdate(
        { _id: id, "students.student": studentId },
        {
          $set: {
            "students.$.attendance": newStudentInfo.attendance,
            "students.$.ratingByStudent": newStudentInfo.ratingByStudent,
            "students.$.feedback": newFeedback?.feedback || "",
          },
        },
        { new: true }
      ).populate("teacher course students.student");

      const newSalary = updateSalaryWhenUpdateLesson(updatedLesson);
      const newEarning = createEarnings(lesson.date);
      const newLeaderboard = createOrUpdaeteLeadboard(updatedLesson);

      if (!newSalary || !newEarning || !newLeaderboard) {
        await Lesson.findByIdAndUpdate(lesson);

        return res.status(400).json({ key: "create-error-occurred" });
      }

      const updatedLessonObj = updatedLesson.toObject();

      const lessonWithOneStudent = {
        ...updatedLessonObj,
        students: updatedLessonObj.students.filter(
          (item) => item.student._id == studentId
        ),
      };

      return res.status(200).json(lessonWithOneStudent);
    }

    // Update lesson for teacher and students
    const updatedLesson = await Lesson.findByIdAndUpdate(id, newLesson, {
      new: true,
    }).populate("teacher course students.student");

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Calculate updated lesson earnings
    const earnings = updatedLesson.students.reduce((total, curr) => {
      if (curr.attendance === 1 || curr.attendance === -1) {
        return (total += curr.student.payment);
      } else {
        return total;
      }
    }, 0);

    updatedLesson.earnings = earnings;
    await updatedLesson.save();

    // Lesson amount calculate for students
    if (lesson.status === "confirmed" && updatedLesson.status !== "confirmed") {
      const updatedStudents = await incrementLessonAmount(updatedLesson);

      if (!updatedStudents) {
        await Lesson.findByIdAndUpdate(lesson._id, lesson);
        return res.status(400).json({ key: "create-error-occurred" });
      }
    } else if (
      lesson.status !== "confirmed" &&
      updatedLesson.status === "confirmed"
    ) {
      const updatedStudents = await decrementLessonAmount(updatedLesson);

      if (!updatedStudents) {
        await Lesson.findByIdAndUpdate(lesson._id, lesson);
        return res.status(400).json({ key: "create-error-occurred" });
      }
    }

    const newSalary = updateSalaryWhenUpdateLesson(updatedLesson);
    const newEarning = createEarnings(lesson.date);
    const newLeaderboard = createOrUpdaeteLeadboard(updatedLesson);

    if (!newSalary || !newEarning || !newLeaderboard) {
      await Lesson.findByIdAndUpdate(lesson);

      return res.status(400).json({ key: "create-error-occurred" });
    }

    res.status(200).json(updatedLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete lesson in table panel
export const deleteLessonInTablePanel = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLesson = await Lesson.findByIdAndDelete(id).populate(
      "teacher students.student"
    );

    if (!deletedLesson) {
      res.status(404).json({ message: "Lesson not found" });
    }

    if (deletedLesson.role === "current") {
      createNotificationForUpdate(
        deletedLesson.teacher,
        deletedLesson.students
      );
    }

    res.status(200).json(deletedLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create current lessons from main lessons
export const createCurrentLessonsFromMainLessons = async (req, res) => {
  try {
    const mainTableData = await Lesson.find({
      role: "main",
    }).populate("teacher");

    const currentWeekStart = new Date();
    const currentWeekEnd = new Date();

    currentWeekStart.setDate(
      currentWeekStart.getDate() -
        (currentWeekStart.getDay() === 0 ? 7 : currentWeekStart.getDay()) +
        1
    );
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const checkCurrentWeeklyLessons = await Lesson.countDocuments({
      date: {
        $gte: currentWeekStart,
        $lte: currentWeekEnd,
      },
      role: "current",
    });

    if (checkCurrentWeeklyLessons > 0) {
      return res.status(400).json({ message: "already create current table" });
    }

    const currentTableData = await Promise.all(
      mainTableData.map(async (data) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + data.day - 1);

        const dataObj = data.toObject();
        delete dataObj._id;
        delete dataObj.status;
        return {
          ...dataObj,
          teacher: data.teacher._id,
          date: date,
          role: "current",
          salary: data.teacher.salary,
        };
      })
    );

    await Lesson.insertMany(currentTableData);

    deleteNotificationForUpdateTable();

    res.status(201).json({ message: "Create current tables" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
