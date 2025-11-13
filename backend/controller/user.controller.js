const User= require('../model/userModel')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
//create User

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password before saving (recommended)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};



//login User

const LoginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};






//get all user
const getUser=async(req,res)=>{

    try {
        const users=await User.find()
        res.status(200).json(users) 
    } catch (error) {
      console.log("Error:",error)   
      res.status(501).json({massege:"Server Error"})
    }
}

const getUserById=async(req,res)=>{
    try {
         const user= await User.findById(req.params.id)
         if(!user) return res.status(404).json({massege:"User Not Found"})
            res.status(200).json(user)      
    } catch (error) {
         console.log(error)
         res.status(500).json({massege:"Server Error"})
    }
}


const deleteUser=async(req,res)=>{
    try {
        const user=await User.findByIdAndDelete(req.params.id)
        
        if(!deleteUser) return res.status(404).json({massege:"User Not Found"})
          res.status(200).json({massege:"User Deleted Successfully"})
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({massege:"Server Error"})
    }
}

const updateUser=async(req,res)=>{
    const {name,email,password}=req.body;

    try {
        let updateData={name,email};
        if(password){
            updateData.password=await bcrypt.hash(password,10);
        }

        const updatedUser= await User.findByIdAndUpdate(req.params.id,{name,email,password},{new:true})
        if(!updatedUser) return res.status(404).json({massege:"User Not Found"})
            res.status(200).json({massege:"User Updated",user:updateUser});
    } catch (error) {
        console.log("Error:",error)
        res.status(501).json({massege:"Server Error"}) 
    }
}

module.exports={

    registerUser,
    LoginUser,
    getUser,
    getUserById,
    deleteUser,
    updateUser,
    
};