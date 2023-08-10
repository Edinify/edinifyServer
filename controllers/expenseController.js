import { Expense } from "../models/expenseModel.js";
import { login } from "./authController.js";

// Get expenses for pagination
export const getExpensesForPagination = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const { startDate, endDate } = req.query;

  try {
    let totalPages;
    let expenses;

    const filterObj = {};

    if (startDate && endDate) {
      const startNewDate = new Date(req.query.startDate);
      const endNewDate = new Date(req.query.endDate);

      filterObj.date = {
        $gte: new Date(startNewDate.toISOString()),
        $lte: new Date(endNewDate.toISOString()),
      };
    }

    const expensesCount = await Expense.countDocuments(filterObj);

    totalPages = Math.ceil(expensesCount / limit);

    expenses = await Expense.find(filterObj)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ expenses, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create expense
export const createExpense = async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();

    const expensesCount = await Expense.countDocuments();
    const lastPage = Math.ceil(expensesCount / 10);

    res.status(201).json({ expense: newExpense, lastPage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updatedExpense);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
