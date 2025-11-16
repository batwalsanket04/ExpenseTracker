 const express=require('express')
const { getUser, getUserById, deleteUser, updateUser, registerUser, LoginUser } = require('../controller/user.controller')
 const Router=express.Router()



Router.post("/register",registerUser)
Router.post("/login",LoginUser)
Router.get("/",getUser)
Router.get("/:id",getUserById)
Router.delete("/:id",deleteUser)
Router.put("/:id",updateUser)

module.exports=Router
