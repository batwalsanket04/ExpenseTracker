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
const creditRoute=require('./routes/credit.route')

//middleware
  app.use(express.json());
 app.use(express.urlencoded({extended:true}))

 const cors=require('cors')
 app.use(
  cors({
    origin:[ "http://localhost:5173",//frontend
           "http://localhost:3000", //backend
           ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


 app.use('/api/user',userRoute)
 app.use('/api/expense',expRoute)
 app.use('/api/credit',creditRoute)

app.get("/",(req,res)=>{

   res.send("API Working")
})


 app.listen(PORT,HOST,()=>{

    console.log(`Server Is up:http://${HOST}:${PORT}`);

 })
