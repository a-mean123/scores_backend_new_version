//import node libs
const path = require('path');
const fs = require('fs');

//import 3rd part libs
const express = require('express');
const cors = require('cors');

//connection to db
require('./db/mongoose');

//import routes
const affectationApi = require('./routes/affectation');
const affectApi = require('./routes/affect');
const formsApi = require('./routes/forms');
const adminApi = require('./routes/admin');
const patientApi = require('./routes/patient');
const doctorApi = require('./routes/doctor');
const responseApi = require('./routes/response');
const demandeApi = require('./routes/demande');

//create app
const app = express();

//server port
const port = process.env.PORT || 3000

//cors , json and files config
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use('/affectation', affectationApi);
app.use('/affect', affectApi);
app.use('/forms', formsApi);
app.use('/admin', adminApi);
app.use('/patient', patientApi);
app.use('/doctor', doctorApi);
app.use('/response', responseApi);
app.use('/demande', demandeApi);

app.get('/getfile/:filename', function (req, res) {
	res.status(200).sendFile(path.join(__dirname + '/upload/' + req.params.filename));
});

app.delete('/deletefile/:filename', function (req, res) {

	fs.unlink(__dirname+ '/upload/' + req.params.filename, function (err) {            
		if (err) {                                                 
			console.error(err);                                    
		}                                                          
	   res.json({deleted: 'success'});                          
	});  
   
});


//TEST API 
app.get('/', (req, res) => res.status(200).send({ message: "Welcome to the server" }))

//RUNNING SERVER
app.listen(port, () => console.log(`server works on port ${port}`));