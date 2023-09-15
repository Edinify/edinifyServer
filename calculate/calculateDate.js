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
    console.log(startDate);
    console.log(endDate);

    return { startDate, endDate };
  } else if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    console.log(startDate);
    console.log(endDate);
    return { startDate, endDate };
  }
};
