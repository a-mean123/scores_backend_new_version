
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scores"

const MONGODB_OPTIONS = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}

mongoose.connect(MONGODB_URI, MONGODB_OPTIONS)
    .then(() => console.log("we're connected to Database !"))
    .catch(() => console.log("connection error !"))

module.exports = mongoose;