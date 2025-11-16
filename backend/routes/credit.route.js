const express=require('express');
const { AddCredit, ShowCredit, showCreditById, deleteCredit, updateCredit, getMonthlyCreditFlexible } = require('../controller/credit.controller');

const Router=express.Router();


Router.post("/add",AddCredit)
Router.get("/user/:userId",ShowCredit)
Router.get("/:id",showCreditById)
Router.delete("/:id",deleteCredit)
Router.put("/:id",updateCredit)
 
 



module.exports=Router;
