import React, { useState, useContext } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { Context } from "../../../Context/storeContext";
import {toast} from 'react-toastify'
 

const Login = () => {
  const { setToken } = useContext(Context);
  const [data, setData] = useState({ email: "", password: "" });

  const navigate = useNavigate();

  const handleForm = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post("http://localhost:3000/api/user/login", data);

    if (res.status === 200 || res.status === 201) {
     
      localStorage.setItem("token", res.data.token);
 
      localStorage.setItem("userId", res.data.user._id);
      console.log("Saved userId:", res.data.user._id);

      localStorage.setItem("userName", res.data.user.name);

      toast.success("Login Successfully");
      navigate("/dashboard");
    } else {
      toast.warning(res.data.message || "Invalid Credentials");
    }
  } catch (error) {
    console.log("Error:", error.response?.data || error.message);
    toast.error(error.response?.data?.message || "Error connecting to server");
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Welcome Back 👋
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            name="email"
            id="email"
            value={data.email}
            onChange={handleForm}
            placeholder="Email address"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            name="password"
            id="password"
            value={data.password}
            onChange={handleForm}
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Login
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <NavLink to="/" className="text-indigo-600 hover:underline font-semibold">
            Sign up
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Login;
