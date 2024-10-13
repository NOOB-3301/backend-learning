import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

console.log(process.env.MONGODB_URI)

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`the server is running ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log('mongoDB connection failed')
})