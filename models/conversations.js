const mongoose = require('../config/mongo.js');


const ConvoSchema = new mongoose.Schema({
 user1_id :{
    type : Number,
    required : true 
 },
 conversation_id :{
    type : mongoose.Schema.Types.ObjectId,
    required : true 
 },
 user2_id  :{
    type : Number,
    required : true 
 },
 created_at :{
    type : Date,
    default : Date.now 
 }
})


module.exports = mongoose.model('Convo' , ConvoSchema);
