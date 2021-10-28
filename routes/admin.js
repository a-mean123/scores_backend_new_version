const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
global.atob = require("atob");
global.Blob = require('node-blob');
const router = express.Router();

const { Admin } = require('../models/admin');
const { Doctor } = require('../models/doctor');
const { Patient } = require('../models/patient');

let filename1 = [];
///secret key
const JWT_SECRET = "htkspp678H5LLM09876BVG34HJ";

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



function jwtDecode(token) {
  if(token){
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }else return null
 }
 
 
 function getUserData(token){
   
     var decoded = jwtDecode(token); 
     
     if (decoded) {
       return decoded.subject; 
     } else return null
 }





async function  verifyToken(req, res, next) {
  try {
    let admin;
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
    if(userData){
      admin = await Admin.findOne({_id:userData._id, email:userData.email,password:userData.password});
      if (!admin) {
        
        res.status(401).send('Unauthorized request')
      }else{
       
      }
    }else{
      res.status(401).send('Unauthorized request')
    }
  
  } catch (error) {
    console.log(error);
  }
  
  next()
}

const upload = multer({ storage: storage });

router.post('/', upload.any('image'), async (req, res) => {

  try {

    let obj = req.body;
    let admin = new Admin(obj);

    const salt = bcrypt.genSaltSync(10);
    // now we set user password to hashed password
    admin.password = bcrypt.hashSync(admin.password, salt);
    admin.photo = filename1[0];
    admin.account_state = true;
    admin.archived = false;
    admin.added_date = new Date();

    let savedadmin = await admin.save()

    res.status(201).send(savedadmin);

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }

});

router.post('/login', async (req, res) => {

  try {
    let adminData = req.body

    let admin = await Admin.findOne({ email: adminData.email })

    if (!admin) {
      res.status(404).send('Invalid Email')
    } else {

      const validPassword = bcrypt.compareSync(adminData.password, admin.password);

      if (!validPassword) {
        res.status(404).send('Invalid Password')
      } else {
        let payload = { subject: admin }
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

    let admin = await Admin.findOne({ _id: id })

    if (!admin) {
      res.status(404).send('Admin not found')
    } else {
      res.send(admin);
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }

});

router.put('/updatephoto/:id', upload.any('image'), async (req, res) => {

  try {
    let id = req.params.id;

    let updated = await Admin.findByIdAndUpdate({ _id: id }, { $set: { photo: filename1[0] } })

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

router.put('/:id', verifyToken, async (req, res) => {

  try {
    let id = req.params.id;
    let data = req.body

    let updated = await Admin
      .findByIdAndUpdate({ _id: id }, {
        $set: {
          name: data.name,
          lastname: data.lastname,
          email: data.email,
        }
      })

    if (!updated) {
      res.status(404).send('Admin not found')
    } else {
      let payload = { subject: updated }
      let token = jwt.sign(payload, 'secretKey')
      res.status(200).send({ token })
    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }

});

router.post('/forgot-password', async (req, res, next) => {

  try {
    const { email } = req.body;

    let admin = await Admin.findOne({ email: email })
    let doctor = await Doctor.findOne({email: email});
    let patient = await Patient.findOne({email: email});

    if (!admin && !doctor && !patient) {

      res.status(404).send('Admin not found')

    } else {

        if(admin){
          const secret = JWT_SECRET + admin.password;
          const payload = {
            email: admin.email,
            _id: admin._id
          }
    
          const token = jwt.sign(payload, secret, { expiresIn: "15min" });
    
          const link = `http://scores-app.fr/resetpassword/${admin._id}/${token}`;
    
          sendEmail(admin.email, link)
    
          res.status(200).send({ etat: 'success' });
        }

        if(patient){
          const secret = JWT_SECRET + patient.password;
          const payload = {
            email: patient.email,
            _id: patient._id
          }
    
          const token = jwt.sign(payload, secret, { expiresIn: "15min" });
    
          const link = `http://scores-app.fr/resetpasswordpatient/${patient._id}/${token}`;
    
          sendEmail(patient.email, link)
    
          res.status(200).send({ etat: 'success' });
        }


        if(doctor){
          const secret = JWT_SECRET + doctor.password;
          const payload = {
            email: doctor.email,
            _id: doctor._id
          }
    
          const token = jwt.sign(payload, secret, { expiresIn: "15min" });
    
          const link = `http://scores-app.fr/resetpassworddoctor/${doctor._id}/${token}`;
    
          sendEmail(doctor.email, link)
    
          res.status(200).send({ etat: 'success' });
        }


    }

  } catch (error) {
    res.status(400).send({ message: "Erreur", error });
  }

})

router.get('/reset-password/:id/:token', async (req, res, next) => {
  try {
    const { id, token } = req.params;

    let admin = await Admin.findOne({ _id: id })

    if (!admin) {
      res.status(404).send('Admin not found')
    } else {
      const secret = JWT_SECRET + admin.password;
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

    let admin = await Admin.findOne({ _id: id })

    if (!admin) {
      res.status(404).send('Admin not found')
    } else {
      const secret = JWT_SECRET + admin.password;

      const payload = jwt.verify(token, secret);
      const salt = bcrypt.genSaltSync(10);
      // now we set user password to hashed password
      password = bcrypt.hashSync(password, salt);
      let updated = await Admin.findByIdAndUpdate({ _id: id }, { password: password })

      if (!updated) {
        res.status(404).send('Admin not found')
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
    html: `
    
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>
<body style=" padding: 0;margin: 0;font-family: Arial, Helvetica, sans-serif;">
  <div style="text-align: center;background: #153d77;box-shadow: 0px 5px 3px rgba(0, 0, 0, 0.25) !important;font-size: 34px;padding: 25px 0;color:white;">
     SCORES </div>
    <div style=" color:  #153d77; font-weight: bold; padding: 28px;height: 30vh;text-align:center">
       <p style="text-align:center">Pour modifier le mot de passe , merci de visiter ce lien.</p>
       <br>
       <a style="text-decoration: none;color: #fff;font-weight: bold;margin-top:100px;cursor:pointer" href="${link}">
          <button style=" background-color: #153d77;padding: 14px 28px;border: none;cursor: pointer;font-weight: bold;color: #fff;border-radius: 25px;">Restorer votre mot de passe</button>
       </a>
    </div>
    <footer style="background: #153d77;color:  #fff;text-align:center;padding:25px;font-size: 18px !important;">
      SCORES-APP
    </footer> 



</body>
    
</html>
    
    `
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}


router.post('/tokenverification', async (req,res)=>{

  let token = req.body.token;
  console.log(token);
  if (token === 'null') {
    console.log("2222");
    res.status(401).send('Unauthorized request')
  }
  let userData = getUserData(token);
  if(userData){
    let admin = await Admin.findOne({_id:userData._id});
  
    if (!admin) {
      console.log('3333333');
      res.status(401).send('Unauthorized request')
    }else{
      res.json({status:200});
    }
  }else{
    res.status(401).send('Unauthorized request')
  }



});



module.exports = router;