import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import {
  createNotificationForLessonsCount,
  createNotificationForUpdate,
  deleteNotificationForLessonCount,
} from "./notificationController.js";

// Create lesson
export const createLesson = async (req, res) => {
  const { role } = req.user;
  console.log("salam necəsən");

  try {
    const teacher = await Teacher.findById(req.body.teacher);

    const newLesson = new Lesson({ ...req.body, salary: teacher.salary });

    await newLesson.populate("teacher course students.student");

    await newLesson.save();

    if (newLesson.role === "current" && role === "admin") {
      createNotificationForUpdate(newLesson.teacher._id, newLesson.students);
    }

    res.status(201).json(newLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// ----------------------------------------------------------------------
// Get lesson
export const getLesson = async (req, res) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findById(id);

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
    }

    res.status(200).json(lesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get lessons
// export const getLessons = async (req, res) => {
//   try {
//     const lessons = await Lesson.find().populate(
//       "teacher course students.student"
//     );

//     res.status(200).json(lessons);
//   } catch (err) {
//     res.status(500).json({ message: { error: err.message } });
//   }
// };
// ------------------------------------------------------------------------------------

// Get weekly lessons for main table
export const getWeeklyLessonsForMainTable = async (req, res) => {
  const { teacherId } = req.query;

  try {
    if (teacherId === "undefined") {
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
    if (teacherId === "undefined") {
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
        $gte: new Date(startDate),
        $lte: new Date(endDate),
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
  const { role } = req.user;

  try {
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

    if (updatedLesson.role === "current" && role === "admin") {
      createNotificationForUpdate(
        updatedLesson.teacher._id,
        updatedLesson.students
      );
    }

    res.status(200).json(updatedLesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update lesson in main panel
export const updateLessonInMainPanel = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  try {
    if (role === "student") {
      const newStudentInfo = req.body?.students[0];
      const updatedLesson = await Lesson.findOneAndUpdate(
        { _id: id, "students.student": req.user.id },
        {
          $set: {
            "students.$.attendance": newStudentInfo.attendance,
            "students.$.ratingByStudent": newStudentInfo.ratingByStudent,
            "students.$.noteByStudent": newStudentInfo.noteByStudent,
          },
        },
        { new: true }
      ).populate("teacher course students.student");

      const updatedLessonObj = updatedLesson.toObject();

      const lessonOneStudents = {
        ...updatedLessonObj,
        students: updatedLessonObj.students.filter(
          (item) => item.student._id == req.user.id
        ),
      };

      return res.status(200).json(lessonOneStudents);
    }

    const lesson = await Lesson.findById(id);
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

    if (role === "admin" && req.body.status !== lesson.status) {
      const students = updatedLesson.students.map((item) => item.student._id);
      if (req.body.status === "confirmed") {
        await Student.updateMany(
          { _id: { $in: students } },
          { $inc: { lessonAmount: -1 } }
        );

        const updatedStudents = await Student.find({ _id: { $in: students } });

        createNotificationForLessonsCount(updatedStudents);
      } else if (lesson.status === "confirmed") {
        await Student.updateMany(
          { _id: { $in: students } },
          { $inc: { lessonAmount: 1 } }
        );

        deleteNotificationForLessonCount(students);
      }
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
    const deletedLesson = await Lesson.findByIdAndDelete(id);

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

// Delete lesson in main panel
export const deleteLessonInMainPanel = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLesson = await Lesson.findByIdAndDelete(id);

    if (!deletedLesson) {
      res.status(404).json({ message: "Lesson Not Found" });
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
    });

    const currentWeekStart = new Date();

    if (currentWeekStart.getDay() !== 0) {
      currentWeekStart.setDate(
        currentWeekStart.getDate() - currentWeekStart.getDay() + 1
      );
    } else {
      if (currentWeekStart.getHours() > 19) {
        currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      } else {
        currentWeekStart.setDate(currentWeekStart.getDate() - 6);
      }
    }

    const currentTableData = mainTableData.map(async (data) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + data.day - 1);

      const teacher = await Teacher.findById(data.teacher);

      const dataObj = data.toObject();
      delete dataObj._id;
      delete dataObj.status;
      return {
        ...dataObj,
        date: date,
        role: "current",
        salary: teacher.salary,
      };
    });

    await Lesson.insertMany(currentTableData);

    res.status(201).json({ message: "Create current tables" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
