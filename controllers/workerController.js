import { Worker } from "../models/workerModal.js";
import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import logger from "../config/logger.js";

export const getWorkers = async (req, res) => {
  const { id, fullName, email } = req.user;
  try {
    const worker = await Worker.find({ role: "worker" });

    res.status(200).json(worker);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET ADMINS",
      functionName: getWorkers.name,
      user: req.user,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

//  get workers for pagination

export const getWorkersForPagination = async (req, res) => {
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let workers;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const workersCount = await Worker.countDocuments({
        fullName: { $regex: regexSearchQuery },
      });

      workers = await Worker.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPages = Math.ceil(workersCount / limit);
    } else {
      const workersCount = await Worker.countDocuments();
      totalPages = Math.ceil(workersCount / limit);
      workers = await Worker.find()
        .skip((page - 1) * limit)
        .limit(limit);
    }
    res.status(200).json({ workers, totalPages });
  } catch (error) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateWorker = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const updatedData = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingWorker = await Worker.findOne({ email });

    if (
      (existingWorker && existingWorker._id != id) ||
      existingStudent ||
      existingTeacher ||
      existingAdmin
    ) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    if (updatedData.password && updatedData.password.length > 5) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData.password = hashedPassword;
    } else {
      delete updatedData.password;
    }

    const newWorker = await Worker.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(newWorker);
  } catch (err) {
    logger.error({
      method: "PATCH",
      status: 500,
      message: err.message,
      for: "UPDATE ADMIN",
      user: req.user,
      postedData: {
        ...req.body,
        password: "",
      },
      functionName: updateWorker.name,
    });

    res.status(500).json({
      message: {
        error: err.message,
      },
    });
  }
};

export const deleteWorker = async (req, res) => {
  const { id } = req.params;

  try {
    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({ key: "worker-not-found" });
    }
    await Worker.findByIdAndUpdate(id, { deleted: true });

    res.status(200).json(worker);
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      for: "DELETE WORKER",
      user: req.user,
      workerdId: id,
      functionName: deleteWorker.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};
