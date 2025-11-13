const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",       
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ["Food", "Petrol", "Bills", "Shopping", "Entertainment", "Other"],
      default: "Other",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
   
    },
  },
  { timestamps: true }
);

 const expense= mongoose.model("Expense", expenseSchema);

module.exports=expense;
