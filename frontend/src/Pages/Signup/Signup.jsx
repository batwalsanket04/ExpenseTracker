import React, { useState } from "react";
import axios from "axios";
import {  NavLink, useNavigate } from "react-router-dom";

const Signup = () => {
    const [data,setData]=useState({name:"",email:"",password:"",Cpassword:""})
    const [error, setError] = useState("");

    const handleForm=(e)=>{
     const {name,value}=e.target;

     const updateData=({...data,[name]:value})
     setData(updateData)
     console.log(updateData)
     

      if (updateData.password && updateData.Cpassword) {
    if (updateData.password !== updateData.Cpassword) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  } else {
    setError("");
  }
};

    const handleSubmit=async(e)=>{
     e.preventDefault();

     if(data.password!==data.Cpassword)
       {
        return setError("Please Check Password")
       }
   try {
    const {name,email,password}=data;
        const res= await axios.post("http://localhost:3000/api/user/register",{name,email,password} )

        if(res.status===201)
        {
            alert(res.data.message)
        }
        else
        {
            alert(res.data.message)||"Something Went Wrong"
        }
   } catch (error) {
       console.log("Error:",error)
       alert("Something Went Wrong")
   }
    }

   
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Create Your Account</h2>

        <form onSubmit={(e)=>handleSubmit(e)} className="space-y-5">
          <input
            type="text"
            name="name"
            onChange={(e)=>handleForm(e)}
            id="name"
            value={data.name}
            placeholder="Full Name"
            
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="email"
            name="email"
            id="email"
            value={data.email}
            placeholder="Email address"
            onChange={(e)=>handleForm(e)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={data.password}
            onChange={(e)=>handleForm(e)}
           
            required
            minLength={8}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            name="Cpassword"
            id="Cpassword"
            placeholder="Confirm Password"
            onChange={(e)=>handleForm(e)}
            value={data.Cpassword}
            required
            minLength={8}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <NavLink to="/login" className="text-indigo-600 hover:underline font-semibold">
            Login
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Signup;
