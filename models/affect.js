const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;

let Affect = mongoose.model('affect', {

    user: ObjectId,
    doctor: ObjectId,
    form: ObjectId,
    date: Date,
    dateRemplissage: Date,
    etat: Boolean

});

module.exports = { Affect };