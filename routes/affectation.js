const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

const { Affectation } = require('../models/affectation');
const { Doctor } = require('../models/doctor');
const { Patient } = require('../models/patient');
const { Admin } = require('../models/admin');


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
  
router.post('/addaffectation', verifyToken, async (req, res) => {
    try {
        obj = req.body;
        let affectation = new Affectation(obj);
        affectation.date = new Date();

        let aff = await Affectation.findOne({ user: obj.user, form: obj.form })

        if (!aff) {
            await affectation.save()
            res.status(200).send({ affected: 1 })
        } else {
            res.status(200).send({ affected: 0 });
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getaffectation/:user', verifyToken, async (req, res) => {
    try {
        let affectations = await Affectation.find({ user: req.params.user })
        res.status(200).send(affectations);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getdoctoraffectation/:user', verifyToken, async (req, res) => {

    try {
        let affectations = await Affectation.find({ user: req.params.user })
        res.status(200).send(affectations);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getformaffectation/:form', verifyToken, async (req, res) => {

    try {
        let affectations = await Affectation.find({ form: req.params.form })
        res.status(200).send(affectations);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getmyform/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        const ObjectId = mongoose.Types.ObjectId;

        let affectations = await Affectation
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(id)
                        }
                    },
                    {
                        $lookup: {
                            from: "forms",
                            localField: "form",
                            foreignField: "_id",
                            as: 'forms'
                        }
                    },
                ]
            )

        let forms = [];

        for (let i = 0; i < affectations.length; i++) {
            forms.push(affectations[i].forms[0]);
        }

        res.status(200).send(forms)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.delete('/deleteaffectation/:user/:form', verifyToken, async (req, res) => {

    try {
        let deletedAffectation = await Affectation.findOneAndDelete({ user: req.params.user, form: req.params.form })

        if (!deletedAffectation) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(deletedAffectation);
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

module.exports = router;