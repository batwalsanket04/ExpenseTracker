import React from "react";
import { Pencil,Trash2 } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import EditCredit from "./EditCredit";
import {toast} from 'react-toastify'

const showCredits = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCredit,setselectedCredit]=useState({})
  const[data,setData]=useState([]);


  const FetchData=async()=>{
    try {
   const userId=localStorage.getItem("userId")

   if(!userId || userId==="null"){
    console.log("Not useID found  in localStorage");
    return;
   }
   const res=await axios.get(`https://expense-tracker-h9ng.onrender.com/api/credit/user/${userId}`)
   setData(res.data.data)
    } catch (error) {
      console.log("Error:",error)
      toast.error("Error to cennecting server")
      
    }
  }

   const deleteCredit=async(id)=>{
      
    try {
      const res=await axios.delete(`https://expense-tracker-h9ng.onrender.com/api/credit/${id}`)
     setData((prev) => prev.filter((val) => val._id !== id));

     toast.success(res.data.message || "Credit Deleted SuccessFully..")
      
    } catch (error) {
       console.log("Error:",error)
      toast.error("Error to connecting Server")
    }

   };

    const form = (updated) => {
    setData((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    );
  };



  
  useEffect(()=>{
    FetchData()
  },[])
   

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Credit Overview
        </h2>
        <p className="text-gray-500">Track all your credits in one place.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((val) => (
          <div
            key={val._id}
            className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
          >
            <h3 className="text-xl font-semibold text-gray-800">{val.source}</h3>

            <p className="mt-2 text-lg font-bold text-green-600">₹{
            val.amount}</p>

            <p className="mt-3 text-gray-700">
              <span className="font-medium text-gray-900">Date:</span>{" "}
              {new Date(val.date).toLocaleDateString()}
            </p>

               <p className="mt-2 text-lg font-bold text-green-600">{
            val.method}</p>


            {val.note && (
              <p className="mt-2 text-gray-700">
                <span className="font-medium text-gray-900">Note:</span> {val.note}
              </p>
            )}


            {/* Buttons UI only */}
            <div className="flex justify-end gap-3 mt-4">
              <button 
               onClick={() => {
                    setselectedCredit(val);
                    setIsModalOpen(true);
                  }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                <Pencil size={18}/>
              </button>

              <button 
               onClick={() => deleteCredit(val._id)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
        <EditCredit
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  credit={selectedCredit}
  onUpdate={form}
/>


      </div>
    </div>
  );
};

export default showCredits;
