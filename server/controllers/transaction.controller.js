const Transaction = require('../models/transaction.model')

module.exports = {
  getTransactionById: async (req, res) => {
    console.log("getTransactionById function called");
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      return res.status(200).json(transaction);
    } catch (err) {
      console.log('Error fetching transaction by ID', err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  getTransactionByUser: async (req, res) => {
    console.log("getTransactionById function called");
    try {
      const { email } = req.params;
      const transactions = await Transaction.find({email});
      if (!transactions.length) {
        return res.status(404).json({});
      }
      return res.status(200).json(transactions);
    } catch (err) {
      console.log('Error fetching transaction by email', err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  getAllTransactions: async (req, res) => {
    console.log("getAllTransactions function called");
    try {
      const transactions = await Transaction.find();
      return res.status(200).json(transactions);
    } catch (err) {
      console.log('Error fetching transactions', err);
      return res.status(500).json({message: 'Internal server error'});
    }
  },
  createTransaction: async (req, res) => {
    console.log("createTransaction function called");

    try {
      const {transactionType, description, amount, date, category, user} = req.body;
      const newTransaction = new Transaction({
        transactionType,
        description,
        amount,
        date,
        category,
        user,
      });
      await newTransaction.save();

      return res.status(201).json({
        message: "Transaction created successfully",
        user: {
          id: newTransaction._id,
          transactionType: newTransaction.transactionType,
          description: newTransaction.description,
          amount: newTransaction.amount,
          date: newTransaction.date,
          category: newTransaction.category,
          user: newTransaction.user,
        },
      });
    } catch (err) {
      console.log('Error while creating the transaction', err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  deleteTransaction: async (req, res) => {
    console.log("deleteTransaction function called");
    try {
      const {id} =  req.params;
      const deletedTransaction = Transaction.findByIdAndDelete(id);
      if (!deletedTransaction) {
        return res.status(404).json({message: 'Transaction not found'});
      }
      return res.status(500).json({message: 'Internal server error'});
    } catch (err) {
       console.log('Error while deleting the transaction', err);
       return res.status(500).json({message: 'Internam server error'});
    }
  },
  updateTransaction: async (req, res) => {
    console.log("updateTransaction function called");
    try {
      const {id} = req.params;
      const updatedData = req.body;
      const updatedTransaction = await Transaction.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      });
      if(!updatedTransaction) {
        return res.status(404).json({message: 'Transaction Not found'});
      }
      return res.status(200).json({
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      });
    } catch (err) {
      console.log('Error updating transaction', err);
      return res.status(500).json({message: 'Internal server error'});
    }
  },
};
