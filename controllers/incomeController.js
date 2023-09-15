import { Income } from "../models/incomeModel.js";

// Get incomes for pagination
export const getIncomesForPagination = async (req, res) => {
  const { startDate, endDate, category } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let incomes;

    const filterObj = {};

    if (category !== "all") {
      filterObj.category = category;
    }

    if (startDate && endDate) {
      const targetStartDate = new Date(startDate);
      const targetEndDate = new Date(endDate);

      targetStartDate.setHours(0, 0, 0, 0);
      targetEndDate.setHours(23, 59, 59, 999);

      filterObj.date = {
        $gte: new Date(targetStartDate),
        $lte: new Date(targetEndDate),
      };
    }

    const incomesCount = await Income.countDocuments(filterObj);

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
