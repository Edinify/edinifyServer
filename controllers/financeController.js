import { Expense } from "../models/expenseModel.js";
import { Income } from "../models/incomeModel.js";

export const getFinance = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const filterObj = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const incomes = await Income.find(filterObj);
    const expenses = await Expense.find(filterObj);

    const totalIncome = incomes.reduce(
      (total, income) => (total += income.amount),
      0
    );

    const totalExpense = expenses.reduce(
      (total, expense) => (total += expense.amount),
      0
    );

    const result = {
      income: totalIncome,
      expense: totalExpense,
      turnover: 0,
      profit: 0,
      chartData: [],
    };
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
