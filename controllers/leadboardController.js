import { Lesson } from "../models/lessonModel.js";
import { Leaderboard } from "../models/leaderboardModel.js";

export const createOrUpdaeteLeadboard = async (lesson) => {
  try {
    const targetDate = new Date(lesson.date);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    let totalLessonCount = 0;
    let totalStarCount = 0;

    const lessons = await Lesson.find({
      role: "current",
      status: "confirmed",
      teacher: lesson.teacher._id,
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth + 1] },
        ],
      },
    });

    lessons.forEach((lesson) => {
      const presentStudents = lesson.students.filter(
        (item) => item.attendance === 1
      );
      totalLessonCount += presentStudents.length;
      presentStudents.forEach((student) => {
        totalStarCount += student.ratingByStudent;
      });
    });

    const checkLeadboard = await Leaderboard.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth + 1] },
        ],
      },
      teacherId: lesson.teacher._id,
    });

    const leaderBoardIds = checkLeadboard.map((item) => item._id);

    await Leaderboard.deleteMany({ _id: { $in: leaderBoardIds } });

    let newLeaderBoard = await Leaderboard.create({
      teacherId: lesson.teacher._id,
      lessonCount: totalLessonCount,
      starCount: totalStarCount,
      date: lesson.date,
    });

    return newLeaderBoard;
  } catch (err) {
    console.log({ message: { error: err.message } }, "leaderboard error");
  }
};
