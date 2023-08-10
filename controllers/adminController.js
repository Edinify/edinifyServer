import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";

// Get admin
export const getAdmin = async (req, res) => {
  const { id } = req.user;
  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update admin password with old password
export const updateAdminPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// update admin password without checking oldpassword

export const updateAdminPasswordWithoutCheckingOldPassword = async (
  req,
  res
) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedAdmin) {
      res.status(404).json({ message: "Not found admin" });
    }

    res.status(200).json({ message: "success updated password" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
