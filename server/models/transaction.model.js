const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionType: {
        type: String,
        required: true,
        enum: ["credit", "debit"],
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    category: {
        type: String,
        required: true,
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
    }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
