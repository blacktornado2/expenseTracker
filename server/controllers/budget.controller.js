const Budget = require('../models/budget.model');

module.exports = {
  getBudgetsByUser: async (req, res) => {
    try {
      const budgets = await Budget.find({ user: req.user.id });
      return res.status(200).json(budgets);
    } catch (err) {
      console.log('Error fetching budgets', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  createBudget: async (req, res) => {
    try {
      const { category, limit } = req.body;
      if (!category || limit === undefined || limit === null) {
        return res.status(400).json({ message: 'category and limit are required' });
      }
      const budget = new Budget({ category, limit, user: req.user.id });
      await budget.save();
      return res.status(201).json(budget);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'A budget for this category already exists' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      console.log('Error creating budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit } = req.body;
      const budget = await Budget.findOneAndUpdate(
        { _id: id, user: req.user.id },
        { limit },
        { new: true, runValidators: true }
      );
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      return res.status(200).json(budget);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      console.log('Error updating budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await Budget.findOneAndDelete({ _id: id, user: req.user.id });
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      return res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (err) {
      console.log('Error deleting budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
