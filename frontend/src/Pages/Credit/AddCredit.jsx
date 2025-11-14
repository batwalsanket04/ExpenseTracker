import React, { useState } from "react";
import axios from "axios";

const AddCredit = () => {
  const [data,setData]=useState({ source:"",amount:"",date:"",method:"",note:""})

 const handleChange=(e)=>{

  const{name,value}=e.target;
  setData({...data,[name]:value})
  console.log(data)
 }

 const handleSubmit=async(e)=>{
  e.preventDefault();

  try {
     const res=await axios.post("http://localhost:3000/api/credit/add",data)
     setData({ source:"",amount:"",date:"",method:"",note:""})

     if(res.status===200 || res.status===201)
     {
      alert (res.data.message || "Credit Added Successfully..!") 
     }
     else{
      alert(res.data.message || "Something Went Wrong")
     }
  } catch (error) {
    console.log("Error:",error);
    console.log("Error  To Connecting The Server")
    
  }
 }



  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="source"
          value={data.source}
          onChange={handleChange}
          id="source"
          placeholder="Credit Source (e.g., Salary, Refund, Gift)"
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
        <input
          type="number"
          name="amount"
          onChange={handleChange}
          value={data.amount}
          id="amount"
          placeholder="Amount (₹)"
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="date"
          onChange={handleChange}
          value={data.date}
          name="date"
          id="date"
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        />
        <select
          name="method"
          id="method"
          onChange={handleChange}
          value={data.method}
          className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full"
        >
          <option value="">Payment Method</option>
          <option>Cash</option>
          <option>Bank Transfer</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Other</option>
        </select>
      </div>

      <textarea
        name="note"
          onChange={handleChange}
        value={data.note}
        id="note"
        placeholder="Note (optional)"
        rows={3}
        className="border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none p-2.5 rounded-lg w-full resize-none"
      ></textarea>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 font-medium shadow-sm"
      >
         Add Credit
      </button>
    </form>
  );
};

export default AddCredit;
