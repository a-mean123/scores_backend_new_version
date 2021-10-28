const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Doctor } = require('../models/doctor');
const { Patient } = require('../models/patient');
const { Admin } = require('../models/admin');

const { Forms } = require('../models/forms');
const multer = require('multer');

const router = express.Router();
//decode
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
  


let filename1 = [];

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




router.post('/upload' , upload.any('image') , (req, res)=>{
        let imagePath = filename1[0];
        filename1 = [];
        console.log(imagePath);
        res.send({image:imagePath});
        
        
});





router.post('/addforms', verifyToken, async (req, res) => {

    try {
        let obj = req.body;

        let forms = new Forms(obj);

        forms.created_date = new Date();
        forms.status = true;
        forms.archived = false;

        let savedForms = await forms.save()

        res.status(200).send(savedForms);

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getforms', verifyToken, async (req, res) => {

    try {

        let forms = await Forms.find({ archived: false })

        res.status(200).send(forms);

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});


router.get('/getformbygender/:gender', verifyToken, async (req, res) => {

    try {
        let gender = req.params.gender;
        let forms = await Forms.find({ archived: false , genre: gender })

        res.status(200).send(forms);

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});
router.get('/getformsfromarchive', verifyToken, async (req, res) => {

    try {

        let forms = await Forms.find({ archived: true })

        res.status(200).send(forms);

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.put('/updateforms/:id', verifyToken, async (req, res) => {

    try {

        let id = req.params.id;
        let data = req.body;



        let updatedForm = await Forms.findByIdAndUpdate({ _id: id }, {
            $set: {
                title: data.title,
                description: data.description,
                created_date: data.created_date,
                questions: data.questions,
            }
        })

        if (!updatedForm) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(updatedForm);
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/archived/:id', verifyToken, async (req, res) => {

    try {
        let id = req.params.id;

        let updatedForm = await Forms.findByIdAndUpdate({ _id: id }, { $set: { archived: true } })

        if (!updatedForm) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(updatedForm);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});


router.get('/restorer/:id', verifyToken, async (req, res) => {
    try {
      let id = req.params.id;
  
      let updatedForms = await Forms.findByIdAndUpdate({ _id: id }, { $set: { archived: false } })
  
      if (!updatedForms) {
        res.status(404).send({ message: "Not found" })
      } else {
        res.status(200).send(updatedForms);
      }
  
    } catch (error) {
      res.status(400).send({ message: "Erreur", error });
    }
  });

router.get('/getformsbyid/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;

        let form = await Forms.findOne({ _id: id ,archived: false })

        if (!form) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(form)
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});


router.get('/delete/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        deleteFiles(id);

        let form = await Forms.findByIdAndDelete({ _id: id })
       
        if (!form) {
            res.status(404).send('not found')
        } else {

            res.status(200).send(form)
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});


async function deleteFiles(id)  {
    
    let form = await Forms.findOne({ _id: id })
       
    if(form){
        for(let q of form.questions){
            for(let o of q.options){
                if(o.image.length>1){
                    fs.unlink( './upload/' + o.image, function (err) {        
                        console.log(o.image);    
                        if (err) {                                                 
                            console.error(err);                                    
                        }                                                          
                                
                    });  
                    
                }
            }
        }
    }
   

}


router.post('/deletemany' , (req,res)=>{

    images = req.body.images;

    for(let img of images){
        fs.unlink( './upload/' + img, function (err) {        
           console.log(img);
            if (err) {                                                 
                console.error(err);                                    
            }                                                          
                    
        });  
    }


});




module.exports = router;