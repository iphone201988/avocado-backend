import { required } from "joi";
import mongoose, {Schema} from "mongoose";


const contactUsSchema=new Schema({
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
     message:{
        type:String,
        // required:true
    }

},
{timestamps:true})

const ContactUsModel=mongoose.model('contactUsSchema',contactUsSchema);
export default ContactUsModel