import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Earning } from "../models/earningsModel.js";
import { Expense } from "../models/expenseModel.js";
import { Income } from "../models/incomeModel.js";

export const getFinance = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    const incomes = await Income.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const expenses = await Expense.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const earnings = await Earning.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const totalIncome = incomes.reduce(
      (total, income) => (total += income.amount),
      0
    );

    const totalExpense = expenses.reduce(
      (total, expense) => (total += expense.amount),
      0
    );

    const totalEarnings = earnings.reduce(
      (total, curr) => (total += curr.earnings),
      0
    );

    const turnover =
      totalIncome > totalEarnings ? totalEarnings : totalIncome - totalEarnings;

    const profit = turnover - totalExpense;

    const result = {
      income: totalIncome,
      expense: totalExpense,
      turnover: turnover,
      profit: profit,
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getChartData = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const incomes = await Income.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const expenses = await Expense.find({
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const earnings = await Earning.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const months = [];
    const chartIncome = [];
    const chartExpense = [];
    const chartTurnover = [];
    const chartProfit = [];

    while (targetDate.startDate <= targetDate.endDate) {
      const targetYear = targetDate.startDate.getFullYear();
      const targetMonth = targetDate.startDate.getMonth();

      const filteredIncomes = incomes.filter(
        (income) =>
          income.date?.getMonth() === targetMonth &&
          income.date?.getFullYear() === targetYear
      );

      const filteredExpenses = expenses.filter(
        (expense) =>
          expense.date?.getMonth() === targetMonth &&
          expense.date?.getFullYear() === targetYear
      );

      const filteredEarnings = earnings.filter(
        (earning) =>
          earning.date?.getMonth() === targetMonth &&
          earning.date?.getFullYear() === targetYear
      );

      const totalIncome = filteredIncomes.reduce(
        (total, income) => (total += income.amount),
        0
      );

      const totalExpense = filteredExpenses.reduce(
        (total, expense) => (total += expense.amount),
        0
      );

      const totalEarnings = filteredEarnings.reduce(
        (total, curr) => (total += curr.earnings),
        0
      );

      const turnover =
        totalIncome > totalEarnings
          ? totalEarnings
          : totalIncome - totalEarnings;

      const profit = turnover - totalExpense;

      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
      }).format(targetDate.startDate);

      months.push({ month: monthName, year: targetYear });
      chartIncome.push(totalIncome);
      chartExpense.push(totalExpense);
      chartTurnover.push(turnover);
      chartProfit.push(profit);

      targetDate.startDate.setMonth(targetDate.startDate.getMonth() + 1);
    }

    res
      .status(200)
      .json({ months, chartIncome, chartExpense, chartTurnover, chartProfit });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
