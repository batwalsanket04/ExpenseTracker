const express=require('express');
const { addExpense, getExpense, getExpByID, deleteExpense, updateExpense, getMonthlyExpenseFlexible } = require('../controller/expenses.controller');
const Router=express.Router();
 

Router.post("/add",addExpense)
Router.get("/user/:userId",getExpense)
Router.get("/:id",getExpByID)
Router.delete("/:id",deleteExpense)
Router.put("/:id",updateExpense)
 

        
module.exports=Router;