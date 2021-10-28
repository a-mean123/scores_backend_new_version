const mongoose = require('mongoose');

let Forms = mongoose.model('forms', {

    title: String,
    description: String,
    created_date: Date,
    questions: Array,
    archived: Boolean,
    status: Boolean,
    genre: String

});

module.exports = { Forms };

