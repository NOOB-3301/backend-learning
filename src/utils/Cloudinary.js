import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

let x = process.env.CLOUDINARY_CLOUD_NAME

const upload_on_Cloudinary = async (localpath)=>{
    // console.log(x);
    
    console.log(localpath)
    try {
        if (!localpath) return null
        //upload file
        const resp = await cloudinary.uploader.upload(localpath,{
            resource_type: "auto"
        })
        //file uploaded success
        // console.log('file uplloaded to cloudinary', resp.url);
        fs.unlinkSync(localpath);
        return resp;
    } catch (error) {
        fs.unlinkSync(localpath) //remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

export {upload_on_Cloudinary}