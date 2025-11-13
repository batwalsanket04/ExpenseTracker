const express=require('express');
const { addExpense, getExpense, getExpByID, deleteExpense, UpdateExpense } = require('../controller/expenses.controller');
const Router=express.Router();
 

Router.post("/add",addExpense)
Router.get("/",getExpense)
Router.get("/:id",getExpByID)
Router.delete("/:id",deleteExpense)
Router.put("/:id",UpdateExpense)


module.exports=Router;