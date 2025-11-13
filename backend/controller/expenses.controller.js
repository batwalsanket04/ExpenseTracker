const Expense=require('../model/expensModel')


const addExpense=async(req,res)=>{
    const {title, amount, category, date, userId}=req.body
    try {
        const userExp= new Expense({title, amount, category, date, userId});
        await userExp.save();
        res.status(200).json({message:"Expenses Added",expense:userExp})
    } catch (error) {
      console.log("Error:",error)
      res.status(500).json({message:"Server Error"})
    }
}


const getExpense=async(req,res)=>{
    try {
        const AllExp=await Expense .find();
        res.status(200).json(AllExp);
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({message:"Server Error"})
    }
}

 const getExpByID=async(req,res)=>{
    try {
        const ExpByID=await Expense.findById(id)
        if(!ExpByID) return res.status(500).json("Expenses Not Found")
            res.status(200).json(ExpByID)
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({message:"Server Error"})
    }
 }


 const deleteExpense=async(req,res)=>{
    try {
        const deleteByID=await Expense.findByIdAndDelete(req.params.id)
        if(!deleteByID) return res.status(500).json({message:"Expense Not Found"})
            res.status(200).json({message:"Expense deleted Successfully" })
    } catch (error) {
         console.log("Error",error)
         res.status(500).json({message:"Server Error"})
    }
 }


 const UpdateExpense = async (req, res) => {
  const { title, amount, category, date, userId } = req.body;

  try {
    const updatedExp = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, category, date, userId },
      { new: true } //  returns updated document
    );

    if (!updatedExp) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense updated successfully",
      Expense: updatedExp,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



 module.exports={
    addExpense,
    getExpense,
    getExpByID,
    UpdateExpense,
    deleteExpense
 }