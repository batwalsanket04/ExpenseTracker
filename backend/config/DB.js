const mongoose=require('mongoose')

const connection=(async()=>{

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB Connected")
        console.log(mongoose.connection.readyState)

    } catch (error) {
        console.log("Connected failed..")
    }
})


module.exports=connection;
