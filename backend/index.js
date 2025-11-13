require('dotenv').config();

const express=require('express')
const app=express()


const HOST='127.0.0.1'
const PORT= process.env.PORT || 3000;

//db Connection

const connection=require('./config/DB')
connection()

const userRoute=require('./routes/user.route')
const expRoute=require('./routes/expenses.route')

//middleware
 app.use(express.json())
 app.use(express.urlencoded({extended:true}))

 const cors=require('cors')
 app.use(cors())
 

 app.use('/api/user',userRoute)
 app.use('/api/expense',expRoute)

 app.listen(PORT,HOST,()=>{

    console.log(`Server Is up:http://${HOST}:${PORT}`);

 })
