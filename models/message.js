const mongoose = require('mongoose');;


const messageSchemea = new mongoose.Schema({
    channel_id : {
        type : Number,
        required : true
    },
    sender_id : {
        type : Number,
        required : true
    },
    content : {
        type : String,
        required : true
    },
    Date: {
        type : Date,
        default : Date.now
    }

})

module.exports = mongoose.model("message", messageSchemea);