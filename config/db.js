const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use public DNS servers to resolve MongoDB SRV records correctly
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
};

module.exports = connectDB;