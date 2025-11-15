const Expense=require('../model/expensModel')


const addExpense = async (req, res) => {
  const { title, amount, category, date, note, userId } = req.body;

  try {
    const userExp = new Expense({
      title,
      amount,
      category,
      date,
      note,
      userId,  
    });

    await userExp.save();

    res.status(200).json({ message: "Expenses Added", data: userExp });

  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



const getExpense = async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log("UserId received:", userId);

    const data = await Expense.find({ userId });

    console.log("Expenses found:", data);

    res.status(200).json(data);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};




 const getExpByID=async(req,res)=>{
  
    try {    
        const id=req.params.id;
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


 const updateExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Expense.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense Updated Successfully",
      updated: updated
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



 module.exports={
    addExpense,
    getExpense,
    getExpByID,
    updateExpense,
    deleteExpense
 }