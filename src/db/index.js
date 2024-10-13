import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
        let url = `${process.env.MONGODB_URI}/${DB_NAME}`
        const connectionResp = await mongoose.connect(url)
        console.log(url)
        console.log(connectionResp.connection.host)
    } catch (error) {
        console.log('error ', error)
        process.exit(1)
    }
}

export default connectDB