import { calcDate } from "../calculate/calculateDate.js";
import { Income } from "../models/incomeModel.js";

// Get incomes for pagination
export const getIncomesForPagination = async (req, res) => {
  const { monthCount, startDate, endDate, category } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    let totalPages;
    let incomes;

    const filterObj = {};

    if (category) {
      filterObj.category = category;
    }

    filterObj.date = {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    };

    const incomesCount = await Income.countDocuments(filterObj);

    console.log(incomesCount);
    totalPages = Math.ceil(incomesCount / limit);

    incomes = await Income.find(filterObj)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ incomes, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create income
export const createIncome = async (req, res) => {
  try {
    const newIncome = new Income(req.body);
    await newIncome.save();

    const incomesCount = await Income.countDocuments();
    const lastPage = Math.ceil(incomesCount / 10);

    res.status(201).json({ income: newIncome, lastPage });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Update income
export const updateIncome = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedIncome = await Income.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedIncome) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updatedIncome);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete income
export const deleteIncome = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedIncome = await Income.findByIdAndDelete(id);

    if (!deletedIncome) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
