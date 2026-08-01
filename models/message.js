const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');;


const messageSchemea = new mongoose.schema({
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
    timestamp: {
        type : Date,
        required : Date.now
    }

})

module.exports = mongoose.model("message", messageSchemea);