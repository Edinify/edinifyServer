import { Earning } from "../models/earningsModel.js";
import { Lesson } from "../models/lessonModel.js";

export const createEarnings = async (date) => {
  const targetDate = new Date(date);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  console.log(1, "EARNINGS");
  console.log(targetDate);
  console.log(targetMonth);
  console.log(targetYear);
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1);

  console.log(startDate, endDate);
  try {
    const confirmedLesson = await Lesson.find({
      status: "confirmed",
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const totalEarnings = confirmedLesson.reduce(
      (total, lesson) => (total += lesson.earnings),
      0
    );

    const checkEarnings = await Earning.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$date" }, targetYear] },
          { $eq: [{ $month: "$date" }, targetMonth + 1] },
        ],
      },
    });

    const checkEarningsIds = checkEarnings.map((item) => item._id);

    await Earning.deleteMany({ _id: { $in: checkEarningsIds } });

    let newEarnings = new Earning({
      earnings: totalEarnings,
      date: targetDate,
    });

    await newEarnings.save();

    // if (!checkEarnings) {
    //   newEarnings = new Earning({
    //     earnings: totalEarnings,
    //     date: targetDate,
    //   });

    //   await newEarnings.save();

    //   console.log(5);
    //   console.log(newEarnings);
    // } else {
    //   checkEarnings.earnings = totalEarnings;
    //   newEarnings = await checkEarnings.save();
    //   console.log(6);
    //   console.log(newEarnings);
    // }

    return newEarnings;
  } catch (err) {
    console.log(err);
    console.log({ message: { error: err.message } }, "erning error");
  }
};
