import { Receipt } from "../models/receiptModel.js";
import { Worker } from "../models/workerModal.js";

// Get receipts for pagination
export const getReceiptForPagination = async (req, res) => {
  const user = req.user;
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let receipts;
    const filterObj = {};

    if (user.role === "teacher" || user.role === "admin") {
      filterObj.creator = user.id;
    }

    if (user.role === "worker") {
      const worker = await Worker.findById(user.id);

      const checkWorkerPosition = worker.positions.find(
        (position) => position.key === "accounting-officer"
      );

      if (!checkWorkerPosition) {
        filterObj.creator = user.id;
      }
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const receiptsCount = await Receipt.countDocuments({
        fullName: { $regex: regexSearchQuery },
        ...filterObj,
      });

      receipts = await Receipt.find({
        fullName: { $regex: regexSearchQuery },
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("creator");

      totalPages = Math.ceil(receiptsCount / limit);
    } else {
      console.log(filterObj);
      const receiptsCount = await Receipt.countDocuments(filterObj);
      totalPages = Math.ceil(receiptsCount / limit);
      receipts = await Receipt.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("creator");
    }

    res.status(200).json({ receipts, totalPages });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create receipt
export const createReceipt = async (req, res) => {
  const { creator } = req.body;
  try {
    const newReceipt = new Receipt({ ...req.body, creatorRole: creator.role });
    await newReceipt.populate("creator");
    newReceipt.populate("creator");
    await newReceipt.save();

    const receiptsCount = await Receipt.countDocuments();
    const lastPage = Math.ceil(receiptsCount / 10);

    res.status(201).json({ receipt: newReceipt, lastPage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update receipt
export const updateReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("creator");

    if (!updatedReceipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete receipt
export const deleteReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await Receipt.findByIdAndDelete(id);

    if (!receipt) {
      res.status(404).json({ message: "receipt not found" });
    }

    res.status(200).json({ message: "receipt successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
