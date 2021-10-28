const express = require('express');
const bcrypt = require("bcrypt");
const multer = require('multer');
const jwt = require('jsonwebtoken');
global.atob = require("atob");
global.Blob = require('node-blob');
const { Doctor } = require('../models/doctor');
const { Patient } = require('../models/patient');
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
    let doctor = new Doctor(obj);


    let findEmailInDoctor = await Doctor.findOne({ email: doctor.email })
    let findEmailInPatient = await Patient.findOne({ email: doctor.email })


    if (!findEmailInDoctor && !findEmailInPatient) {

      try {
        const salt = bcrypt.genSaltSync(10);
        // now we set user password to hashed password
        doctor.password = bcrypt.hashSync(doctor.password, salt);

        filename1[0] ? doctor.photo = filename1[0] : doctor.photo = 'default.png';
        doctor.account_state = true;
        doctor.archived = false;
        doctor.added_date = new Date();


        let saveddoctor = await doctor.save()
        filename1 = []

        if (!saveddoctor) {
          res.status(404).send('not found')
        } else {
          res.status(200).send(saveddoctor);
        }
      } catch (error) {
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
    let doctorData = req.body

    let doctor = await Doctor.findOne({ email: doctorData.email })
    if (!doctor) {
      res.status(404).send('not found')
    } else {
      const validPassword = bcrypt.compareSync(doctorData.password, doctor.password);
      if (!validPassword) {
        res.status(401).send('Invalid Password')
      } else {
        let payload = { subject: doctor }
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

    let doctor = await Doctor.findOne({ _id: id })

    if (!doctor) {
      res.status(404).send('not found')
    } else {
      res.status(200).send(doctor);
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.put('/updatephoto/:id', upload.any('image'), async (req, res) => {

  try {
    let id = req.params.id;

    let updated = await Doctor.findByIdAndUpdate({ _id: id }, { $set: { photo: filename1[0] } })

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

router.get('/', verifyToken, async (req, res) => {
  try {
    let doctors = await Doctor.find({ archived: false })
    res.status(200).send(doctors);
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});


router.get('/getbygender/:genre', verifyToken, async (req, res) => {
  try {

    let genre = req.params.genre;

    let doctors = await Doctor.find({ archived: false, gender: genre })
    res.status(200).send(doctors);
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

    let updateddoctor = await Doctor.findByIdAndUpdate({ _id: id }, data, { new: true })

    if (!updateddoctor) {
      res.status(404).send('not found')
    } else {
      let payload = { subject: updateddoctor }
      let token = jwt.sign(payload, 'secretKey')
      res.status(200).send({ token });
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let doctor = await Doctor.findByIdAndDelete({ _id: id })

    if (!doctor) {
      res.status(404).send('not found')
    } else {
      res.status(200).send(doctor);
    }
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/archived/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let updatedForms = await Doctor.findByIdAndUpdate({ _id: id }, { $set: { archived: true } })

    if (!updatedForms) {
      res.status(404).send('not found')
    } else {
      res.status(200).send(updatedForms);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/restorer/:id', verifyToken, async (req, res) => {
  try {
    let id = req.params.id;

    let updatedForms = await Doctor.findByIdAndUpdate({ _id: id }, { $set: { archived: false } })

    if (!updatedForms) {
      res.status(404).send('not found')
    } else {
      res.status(200).send(updatedForms);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.get('/archive/getdoctorfromarchive', verifyToken, async (req, res) => {
  try {
    let doctors = await Doctor.find({ archived: true })
    res.status(200).send(doctors);
  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }
});

router.put('/lockunlock/:id', verifyToken, async (req, res) => {

  try {
    let id = req.params.id;
    let lock = req.body;

    let updatedForms = await Doctor.findByIdAndUpdate({ _id: id }, { $set: { account_state: lock.lock } })

    if (!updatedForms) {
      res.status(404).send('not found')
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

    let user = await Doctor.findOne({ _id: id })

    if (!user) {
      res.status(404).send('not found')
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

    let user = await Doctor.findOne({ _id: id })

    if (!user) {
      res.status(404).send('not found')
    } else {
      const secret = JWT_SECRET + user.password;

      const payload = jwt.verify(token, secret);
      const salt = bcrypt.genSaltSync(10);
      // now we set user password to hashed password
      password = bcrypt.hashSync(password, salt);

      await Doctor.findByIdAndUpdate({ _id: id }, { password: password })

      res.status(200).send('success');
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