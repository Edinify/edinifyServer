import { Notification } from "../models/notificationModel.js";
import { Student } from "../models/studentModel.js";

// CREATE NOTIFICATION

// Create notification for birthday
export const createNotificationForBirthday = async () => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 2);
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;

  try {
    const birthdayStudents = await Student.find({
      $expr: {
        $and: [
          { $eq: [{ $dayOfMonth: "$birthday" }, currentDay] },
          { $eq: [{ $month: "$birthday" }, currentMonth] },
        ],
      },
      status: true,
    });

    birthdayStudents.map(async (student) => {
      await Notification.create({
        role: "birthday",
        student: student._id,
        isBirthday: true,
      });
    });
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};

// Create notification for update table
export const createNotificationForUpdate = async (teacherId, students) => {
  try {
    await Notification.create({
      role: "update-teacher-table",
      teacher: teacherId,
      isUpdatedTable: true,
    });

    students.map(async (item) => {
      await Notification.create({
        role: "update-student-table",
        student: item.student._id,
        isUpdatedTable: true,
      });
    });
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};

// Create notification for lesson count
export const createNotificationForLessonsCount = async (students) => {
  try {
    const completedCourseStudents = students.filter(
      (student) => student.lessonAmount === 0
    );

    completedCourseStudents.map(async (student) => {
      await Notification.create({
        role: "count",
        student: student._id,
        isZeroClassCount: true,
      });
    });

    console.log("success create");
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};

// GET NOTIFICATIONS

// Get notifications for admin
export const getNotificationsForAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find({
      role: { $in: ["birthday", "count"] },
    }).populate("student");

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get notifications for teacher
export const getNotificationsForTeacher = async (req, res) => {
  const { id } = req.user;
  try {
    const notifications = await Notification.find({
      $or: [
        { role: "birthday" },
        {
          role: "update-teacher-table",
          teacher: id,
        },
      ],
    }).populate("student");

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get notifications for student
export const getNotificationsForStudent = async (req, res) => {
  const { id } = req.user;
  try {
    const notifications = await Notification.find({
      role: { $in: ["count", "update-student-table"] },
      student: id,
    });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// DELETE NOTIFICATIONS

// Delete notification for lesson count
export const deleteNotificationForLessonCount = async (students) => {
  console.log(students);
  try {
    await Notification.deleteMany({
      student: { $in: students },
      role: "count",
    });
    console.log("success");
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};

// delete notification for update table

export const deleteNotificationForUpdateTable = async () => {
  try {
    await Notification.deleteMany({
      isUpdatedTable: true,
    });
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};

// delete notification for birthday
export const deleteNotificationsForBirthday = async (req, res) => {
  const currDate = new Date();
  currDate.setDate(currDate.getDate() - 1);

  try {
    const students = await Student.find({
      $expr: {
        $and: [
          { $eq: [{ $dayOfMonth: "$birthday" }, currDate.getDate()] },
          { $eq: [{ $month: "$birthday" }, currDate.getMonth() + 1] },
        ],
      },
      status: true,
    })
      .select("_id")
      .lean();

    const studentsId = students.map((student) => student._id);

    await Notification.deleteMany({
      student: { $in: studentsId },
      role: "birthday",
    });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Do as notification seen
export const doAsNotificationsSeen = async (req, res) => {
  const { role } = req.user;

  try {
    let updatedNotifications;

    if (role === "admin") {
      updatedNotifications = await Notification.updateMany(
        { isViewedAdmin: false },
        { isViewedAdmin: true },
        { new: true }
      );
    } else if (role === "teacher") {
      updatedNotifications = await Notification.updateMany(
        { isViewedTeacher: false },
        { isViewedTeacher: true },
        { new: true }
      );
    } else if (role === "student") {
      updatedNotifications = await Notification.updateMany(
        { isViewedStudent: false },
        { isViewedStudent: true },
        { new: true }
      );
    }

    res.status(200).json(updatedNotifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
