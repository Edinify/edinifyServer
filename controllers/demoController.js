import { Demo } from "../models/demoModel.js";

// Get demos for pagination
export const getDemosForPagination = async (req, res) => {
  const { searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    let totalPages;
    let demos;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const demosCount = await Demo.countDocuments({
        fullName: { $regex: regexSearchQuery },
      });

      demos = await Demo.find({
        fullName: { $regex: regexSearchQuery },
      })
        .skip((page - 1) * limit)
        .limit(limit);

      totalPages = Math.ceil(demosCount / limit);
    } else {
      const demosCount = await Demo.countDocuments();
      totalPages = Math.ceil(demosCount / limit);
      demos = await Demo.find()
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.status(200).json({ demos, totalPages });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create demo
export const createDemo = async (req, res) => {
  try {
    const newDemo = new Demo(req.body);
    await newDemo.save();

    const demosCount = await Demo.countDocuments();
    const lastPage = Math.ceil(demosCount / 10);

    res.status(201).json({ demo: newDemo, lastPage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update demo
export const updateDemo = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedDemo = await Demo.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedDemo) {
      return res.status(404).json({ message: "Demo not found" });
    }

    res.status(200).json(updatedDemo);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete demo
export const deleteDemo = async (req, res) => {
  const { id } = req.params;

  try {
    const demo = await Demo.findByIdAndDelete(id);

    if (!demo) {
      res.status(404).json({ message: "demo not found" });
    }

    res.status(200).json({ message: "demo successfully deleted" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
