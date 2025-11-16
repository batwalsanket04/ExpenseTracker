const mongoose = require("mongoose");

const connection = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log(" MONGO_URI is missing in environment variables!");
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB Connected Successfully");
  } catch (error) {
    console.error(" MongoDB Connection Failed:", error.message);
  }
};

module.exports = connection;
