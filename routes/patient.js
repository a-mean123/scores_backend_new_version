const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
global.atob = require("atob");
global.Blob = require('node-blob');
const { Patient } = require('../models/patient');
const { Doctor } = require('../models/doctor');
const { Admin } = require('../models/admin');


let filename1 = [];
///secret key
const JWT_SECRET = "htkspp678H5LLM09876BVG34HJ";

const router = express.Router();

const storage = multer.diskStorage(
  {
    destination: './upload',
    filename: function (req, file, cb) {
      date = Date.now();
      cb(null, date + '.' + file.mimetype.split('/')[1]);
      let fl = date + '.' + file.mimetype.split('/')[1];
      filename1.push(fl);
    },
  }
);

const upload = multer({ storage: storage });

function jwtDecode(token) {
  if (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } else return null
}


function getUserData(token) {

  var decoded = jwtDecode(token);

  if (decoded) {
    return decoded.subject;
  } else return null
}





async function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    console.log('1111');
    return res.status(401).send('Unauthorized request')
  }
  let token = req.headers.authorization.split(' ')[1]
  if (token === 'null') {
    console.log("2222");
    return res.status(401).send('Unauthorized request')
  }
  let userData = getUserData(token);
  if (userData) {
    let doctor = await Doctor.findOne({ _id: userData._id, email: userData.email, password: userData.password });
    let patient = await Patient.findOne({ _id: userData._id, email: userData.email, password: userData.password });
    let admin = await Admin.findOne({ _id: userData._id, email: userData.email, password: userData.password });



    if (!doctor && !patient && !admin) {


      res.status(401).send('Unauthorized request')
    } else {

    }
  } else {
    res.status(401).send('Unauthorized request')
  }

  next()
}

router.post('/', upload.any('image'), async (req, res) => {
  try {
    let obj = req.body;
    let patient = new Patient(obj);


    let findEmailInDoctor = await Doctor.findOne({ email: patient.email })
    let findEmailInPatient = await Patient.findOne({ email: patient.email })


    if (!findEmailInDoctor && !findEmailInPatient) {

      try {
        const salt = bcrypt.genSaltSync(10);
        // now we set user password to hashed password
        patient.password = bcrypt.hashSync(patient.password, salt);

        filename1[0] ? patient.photo = filename1[0] : patient.photo='default.png';
        patient.account_state = true;
        patient.archived = false;
        patient.added_date = new Date();


        let savedpatient = await patient.save()
        filename1 = []

        if (!savedpatient) {
          res.status(404).send('not found')
        } else {
          res.status(200).send(savedpatient);
        }
      } catch (error) {
        console.log(error);
        res.status(400).send({ message: "Erreur", error });
      }


    } else {
      res.status(404).send('email invalid')
    }


  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});



router.post('/login', async (req, res) => {
  try {
    let patientData = req.body

    let patient = await Patient.findOne({ email: patientData.email })

    if (!patient) {
      res.status(401).send('Invalid Email')
    } else {
      const validPassword = bcrypt.compareSync(patientData.password, patient.password);
      if (!validPassword) {
        res.status(401).send('Invalid Password')
      } else {
        let payload = { subject: patient }
        let token = jwt.sign(payload, 'secretKey')
        res.status(200).send({ token })
      }
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let patient = await Patient.findOne({ _id: id })
    if (!patient) {
      res.status(404).send({ message: "Not found" })
    }
    else {
      res.status(200).send(patient);
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});




router.get('/', verifyToken, async (req, res) => {
  try {
    let patients = await Patient.find({ archived: false })
    res.status(200).send(patients);
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/getbygender/:genre', verifyToken, async (req, res) => {
  try {

    let genre = req.params.genre;

    let patients = await Patient.find({ archived: false, gender: genre })
    res.status(200).send(patients);
  } catch (error) {
	console.log(error);		
    res.status(400).send({ message: "Erreur", error });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;
    let data = req.body

    data.password ? data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(10)) : null

    let updatedpatient = await Patient.findByIdAndUpdate({ _id: id }, data, { new: true })

    if (!updatedpatient) {
      res.status(404).send({ message: "Not foud" })
    } else {
      let payload = { subject: updatedpatient }
      let token = jwt.sign(payload, 'secretKey')
      res.status(200).send({ token });
    }

  } catch (error) {
	console.log(error);
    res.status(400).send({ message: "Erreur", error });
  }
});


router.put('/updatephoto/:id', upload.any('image'), async (req, res) => {

  try {
    let id = req.params.id;

    let updated = await Patient.findByIdAndUpdate({ _id: id }, { $set: { photo: filename1[0] } })

    if (!updated) {
      res.status(404).send('Admin not found')
    } else {
      filename1 = [];
      res.status(200).send(updated);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }


});


router.delete('/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let patient = await Patient.findByIdAndDelete({ _id: id })
    if (!patient) {
      res.status(404).send({ message: "Not found" })
    }
    else {
      res.status(200).send(patient);
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/archived/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let updatedForms = await Patient.findByIdAndUpdate({ _id: id }, { $set: { archived: true } })

    if (!updatedForms) {
      res.status(404).send({ message: "Not found" })
    }
    else {
      res.status(200).send(updatedForms);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/restorer/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let updatedForms = await Patient.findByIdAndUpdate({ _id: id }, { $set: { archived: false } })

    if (!updatedForms) {
      res.status(404).send({ message: "Not found" })
    } else {
      res.status(200).send(updatedForms);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/archive/getpatientfromarchive', verifyToken, async (req, res) => {
  try {
    let patients = await Patient.find({ archived: true })
    res.status(200).send(patients);
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.put('/lockunlock/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;
    let lock = req.body;

    let updatedForms = await Patient
      .findByIdAndUpdate({ _id: id }, { $set: { account_state: lock.lock } })
    if (!updatedForms) {
      res.status(404).send({ message: "Not found" })
    } else {
      res.status(200).send(updatedForms);
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});



router.get('/reset-password/:id/:token', async (req, res, next) => {
  try {
    const { id, token } = req.params;

    let user = await Patient.findOne({ _id: id })

    if (!user) {
      res.status(404).send('invalid');
    } else {
      const secret = JWT_SECRET + user.password;
      const payload = jwt.verify(token, secret);

      res.status(200).send({ etat: "success" });
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.post('/reset-password/:id/:token', async (req, res, next) => {
  try {
    const { id, token } = req.params;

    let { password } = req.body;

    let user = await Patient.findOne({ _id: id })

    if (!user) {
      res.status(404).send('invalid');
    } else {
      const secret = JWT_SECRET + user.password;
      const payload = jwt.verify(token, secret);
      const salt = bcrypt.genSaltSync(10);
      // now we set user password to hashed password
      password = bcrypt.hashSync(password, salt);

      let patient = await Patient.findByIdAndUpdate({ _id: id }, { password: password })

      if (!patient) {
        res.status(404).send({ message: "Not found" });
      } else {
        res.status(200).send('success');
      }
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

async function sendEmail(email, link) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false,

    auth: {
      user: 'scoreapp2021@gmail.com', // generated ethereal user
      pass: 'yjjbvssiusanftdr', // generated ethereal password
    },
  });

  let mailOptions = {
    from: 'scoreapp2021@gmail.com',
    to: email,
    subject: 'Modifier votre mot de passe',
    text: link
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}

module.exports = router;