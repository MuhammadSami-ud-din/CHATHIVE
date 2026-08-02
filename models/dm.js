const mongoose = require('../config/mongo.js');


const dmSchema = new mongoose.Schema({
 message_id :{
    type : mongoose.Schema.Types.ObjectId,
    required : true 
 },
 conversation_id :{
    type : mongoose.Schema.Types.ObjectId,
    required : true 
 },
 sender_id  :{
    type : Number,
    required : true 
 },
 content :{
    type : String,
    required : true 
 },
 created_at :{
    type : Date,
    default : Date.now 
 }
})

module.exports = mongoose.model('DM' , dmSchema);