const SavingsGoal = require('../models/savingsGoal.model');

module.exports = {
  getSavingsGoal: async (req, res) => {
    try {
      const goal = await SavingsGoal.findOne({ user: req.user.id });
      return res.status(200).json({ amount: goal ? goal.amount : 0 });
    } catch (err) {
      console.log('Error fetching savings goal', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  upsertSavingsGoal: async (req, res) => {
    try {
      const { amount } = req.body;
      if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
        return res.status(400).json({ message: 'amount is required' });
      }
      const goal = await SavingsGoal.findOneAndUpdate(
        { user: req.user.id },
        { amount },
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ amount: goal.amount });
    } catch (err) {
      console.log('Error upserting savings goal', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
