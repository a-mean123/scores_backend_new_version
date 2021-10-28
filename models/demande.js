const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;

let Demande = mongoose.model('demande', {

    patient: ObjectId,
    doctor: ObjectId,
    status: Boolean

});

module.exports = { Demande };