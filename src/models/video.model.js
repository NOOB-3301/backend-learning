import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const vidSchema= new Schema({
    videoFile:{
        type:String,//clounary url
        required: true,
    },
    thumbnail:{
        type:String, //clounary url
        required: true,        
    },
    title:{
        type:String, 
        required: true,  
    },
    description:{
        type:String, //clounary url
        required: true,  
    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    isppublished:{
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps:true})


vidSchema.plugin(mongooseAggregatePaginate)
export const Video= mongoose.model("Video", vidSchema)
