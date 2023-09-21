import { Earning } from "../models/earningsModel.js";
import { Lesson } from "../models/lessonModel.js";

export const createEarnings = async (date) => {
  const targetDate = new Date(date);
  const targetMonth = targetDate.getMonth() + 1;
  const targetYear = targetDate.getFullYear();
  console.log("salam earnings");
  console.log(targetDate);
  console.log(targetYear);
  console.log(targetMonth);
  try {
    const confirmedLesson = await Lesson.find({
      $expr: {
        $and: [
          { $eq: { $year: "$date" }, targetYear },
          { $eq: { $month: "$date" }, targetMonth },
        ],
      },
    });

    const totalEarnings = confirmedLesson.reduce(
      (total, lesson) => (total += lesson.earnings),
      0
    );

    const checkEarnings = await Earning.findOne({
      $expr: {
        $and: [
          { $eq: { $year: "$date" }, targetYear },
          { $eq: { $month: "$date" }, targetMonth },
        ],
      },
    });

    if (!checkEarnings) {
      const newEarnings = new Earning({
        earnings: totalEarnings,
        date: targetDate,
      });

      await newEarnings.save();
    } else {
      checkEarnings.earnings = totalEarnings;
      await checkEarnings.save();
    }
  } catch (err) {
    console.log({ message: { error: err.message } });
  }
};
