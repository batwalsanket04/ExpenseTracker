const Credit=require('../model/creditModel')


const AddCredit=async(req,res)=>{

    const {source,amount,date,method,note,userId}=req.body;
 try {
   const credit= new Credit({source,amount,date,method,note,userId})
   await credit.save();
    res.status(200).json({success:true,message:"Credit Added",data:credit})
 } catch (error) {
    console.log("Error:",error)
    res.status(500).json({ success:false, message:"Server Error"})
 }
}

 
const ShowCredit = async (req, res) => {
  try {
    const userId=req.params.userId
    const credits = await Credit.find({userId});
    res.status(200).json({ success: true, data: credits });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const showCreditById=async(req,res)=>{
    const id=req.params.id;
 try {
    const CreditByid=await Credit.findById(id)
    if(!CreditByid) res.status(500).json({success:false,message:"Credit Not Found"})
        res.status(200).json(CreditByid)
 } catch (error) {
     console.log("Error:",error)
     res.status(500).json({ success:false, message:"Server Error"})
 }
}

const deleteCredit = async (req, res) => {
  try {
    const deletedCredit = await Credit.findByIdAndDelete(req.params.id);

    if (!deletedCredit) {
      return res.status(404).json({ success: false, message: "Credit not found" });
    }

    res.status(200).json({ success: true, message: "Deleted Successfully." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



const updateCredit=async(req,res)=>{
    const {source,amount,date,method,note,userId}=req.body
    try {

        const UpdateData=await Credit.findByIdAndUpdate(req.params.id,{source,amount,date,method,note,userId},{new:true})
        if(!UpdateData) return res.status(500).json({success:false,message:"Credit Not Found"})
            res.status(200).json({success:true,message:"Credit Updated Successfully", credit:UpdateData})
    } catch (error) {
        console.log("Error:",error);
        res.status(500).json({success:false,message:"Server Error"})
    }
}
 

 

module.exports={
    AddCredit,
    ShowCredit,
    showCreditById,
    deleteCredit,
    updateCredit,
  
}