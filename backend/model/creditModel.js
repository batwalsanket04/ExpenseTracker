const mongoose=require('mongoose')

const CreditSchema= new mongoose.Schema({
  
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true,
    },
    source: {
    type: String,
    required: true,  
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  method: {
    type: String,
    enum: ["Cash", "Bank Transfer", "UPI", "Card", "Other"], 
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
   
}, { timestamps: true });

const Credit=mongoose.model("Credit",CreditSchema)

module.exports=Credit;
