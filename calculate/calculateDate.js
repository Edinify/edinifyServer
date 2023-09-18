export const calcDate = (monthCount, start, end) => {
  if (monthCount) {
    monthCount = Number(monthCount);
    const startDate = new Date();
    const endDate = new Date();

    startDate.setMonth(startDate.getMonth() - (monthCount - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  } else if (start && end) {
    console.log(start);
    console.log(end, "end");
    const startDate = new Date(start);
    const endDate = new Date(end);

    console.log(startDate);
    console.log(endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
};
