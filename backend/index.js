require('dotenv').config();

const express=require('express')
const app=express()

  
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
    origin: "http://localhost:5173",//frontend
          
          
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


 app.listen(PORT,"0.0.0.0",()=>{

    console.log(`Server Is up:${PORT}`);

 })
