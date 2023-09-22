import { Lesson } from "../models/lessonModel.js";
import { Leaderboard } from "../models/leaderboardModel.js";

export const createOrUpdaeteLeadboard = async (lesson) => {
  try {
    const targetDate = new Date(lesson.date);
    const targetMonth = targetDate.getMonth() + 1;
    const targetYear = targetDate.getFullYear();

    console.log(lesson.teacher._id);
    console.log(targetMonth, targetYear);
    const lessons = await Lesson.find({
      role: "current",
      status: "confirmed",
      teacher: lesson.teacher._id,
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth] },
        ],
      },
    });

    console.log(lessons.map(lesson=> lesson.students))

    const totalLessonCount = lessons.reduce(
      (total, lesson) =>
        (total += lesson.students.filter(
          (item) => item.attendance === 1
        ).length),
      0
    );

    const checkLeadboard = await Leaderboard.findOne({
      teacherId: lesson.teacher._id,
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth] },
        ],
      },
    });

    console.log(checkLeadboard);
    if (!checkLeadboard) {
      await Leaderboard.create({
        teacherId: lesson.teacher._id,
        lessonCount: totalLessonCount,
        date: lesson.date,
      });

      console.log("create leadboard successfully");
      return;
    }

    checkLeadboard.lessonCount = totalLessonCount;
    await checkLeadboard.save();
    console.log("update leadboard successfully");
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};
