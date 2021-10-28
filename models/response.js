const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;

let Response = mongoose.model('response', {

    user: ObjectId,
    doctor: ObjectId,
    form: ObjectId,
    created_date: Date,
    responses: Array,
    score: Number,
    archived: Boolean,

});

module.exports = { Response };