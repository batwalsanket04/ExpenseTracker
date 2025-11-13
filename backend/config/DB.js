const mongoose=require('mongoose')

const connection=(async()=>{

    try {
        await mongoose.connect("mongodb://localhost:27017/ExpTracker")
        console.log("DB Connected")
        console.log(mongoose.connection.readyState)

    } catch (error) {
        console.log("Connected failed..")
    }
})


module.exports=connection;
