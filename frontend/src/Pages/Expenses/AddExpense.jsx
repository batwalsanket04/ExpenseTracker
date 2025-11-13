import React from "react";
import { useState } from "react";
import axios from "axios";

const AddExpense = () => {
  const [data,setData]=useState({
    title:"",
    amount:"",
    category:"",
    date:"",
    note:""
  })

  const handleForm=(e)=>{
   const {name,value}=e.target;
   setData({...data,[name]:value})
  } 

  const handleSubmit=async(e)=>{
   e.preventDefault();
   try {
  const userId = localStorage.getItem("userId");
    const res=await axios.post("http://localhost:3000/api/expense/add",{...data,userId})
    setData({ title: "", amount: "", category: "", date: "", note: "" });
    if(res.status===200)
    {
      alert(res.data.message)
    }
    else{
      alert(res.data.message || "Something Went Wrong")
    }
    
   } catch (error) {
    console.log("Error",error)
    alert("Error To connect server")
   }
  }


  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-4">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" id="title" name="title" value={data.title} onChange={(e)=>handleForm(e)} placeholder="Title" className="w-full border p-2 rounded-lg" />
        <input type="number" id="amount" name="amount" value={data.amount} onChange={(e)=>handleForm(e)} placeholder="Amount" className="w-full border p-2 rounded-lg" />
        <select  id="category" name="category" value={data.category} onChange={(e)=>handleForm(e)} className="w-full border p-2 rounded-lg">
         <option value="">Select Category</option>
          <option>Food</option>
          <option>Petrol</option>
          <option>Bills</option>
          <option>Shopping</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>
        <input type="date" id="date" value={data.date} onChange={(e)=>handleForm(e)} name="date" className="w-full border p-2 rounded-lg" />
        <textarea placeholder="Note (optional)" name="note" value={data.note} onChange={(e)=>handleForm(e)} id="note" className="w-full border p-2 rounded-lg"></textarea>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
