const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { Affect } = require('../models/affect');
const { Demande } = require('../models/demande');
const { Doctor } = require('../models/doctor');
const { Patient } = require('../models/patient');
const { Admin } = require('../models/admin');

const router = express.Router();


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
  

router.post('/adddemande', verifyToken, async (req, res) => {
    try {
        let obj = req.body;
        let demande = new Demande(obj);
        demande.status = false;

        let saveddemandeation = await demande.save()
        res.send(saveddemandeation);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/checkdemande/:patient/:doctor', verifyToken, async (req, res) => {
    try {
        let p = req.params.patient;
        let d = req.params.doctor;

        let demandeations = await Demande.findOne({ patient: p, doctor: d })
        if (!demandeations) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(demandeations);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getmydoctor/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        const ObjectId = mongoose.Types.ObjectId;

        doctorslist = [];

        let demandes = await Demande
            .aggregate(
                [
                    {
                        $match: {
                            patient: ObjectId(id),
                            status: true,
                        }
                    },
                    {
                        $lookup: {
                            from: "doctors",
                            localField: "doctor",
                            foreignField: "_id",
                            as: 'doctors'
                        }
                    },
                ]
            )
        for (let i = 0; i < demandes.length; i++) {
            doctor = {
                doctors: demandes[i].doctors[0],
                forms: null
            };

            let affects = await Affect.find({ user: id, doctor: demandes[i].doctors[0]._id })
            doctor.forms = affects.length;
            doctorslist.push(doctor);
        }

        res.status(200).send(doctorslist)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
        console.log(error);

    }
});

router.get('/getmypatient/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        const ObjectId = mongoose.Types.ObjectId;

        patientslist = [];

        let demandes = await Demande
            .aggregate(
                [
                    {
                        $match: {
                            doctor: ObjectId(id),
                            status: true,
                        }
                    },
                    {
                        $lookup: {
                            from: "patients",
                            localField: "patient",
                            foreignField: "_id",
                            as: 'patients'
                        }
                    },
                ]
            )
        for (let i = 0; i < demandes.length; i++) {
            patient = {
                patients: demandes[i].patients[0],
                forms: null
            };
            let affects = await Affect.find({ doctor: id, user: demandes[i].patients[0]._id })
            patient.forms = affects.length;
            patientslist.push(patient);
        }
        res.status(200).send(patientslist)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getdemande/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        const ObjectId = mongoose.Types.ObjectId;

        doctorslist = [];

        let demandes = await Demande
            .aggregate(
                [
                    {
                        $match: {
                            doctor: ObjectId(id),
                            status: false
                        }
                    },
                    {
                        $lookup: {
                            from: "patients",
                            localField: "patient",
                            foreignField: "_id",
                            as: 'patients'
                        }
                    },
                ]
            )
        for (let i = 0; i < demandes.length; i++) {
            doctorslist.push(
                {
                    patient: demandes[i].patients[0],
                    status: demandes[i].status,
                    _id: demandes[i]._id
                }
            );
        }
        res.status(200).send(doctorslist)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getincompletedform/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        const ObjectId = mongoose.Types.ObjectId;

        let demandes = await Demande
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(id),
                            etat: false,
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

        for (let i = 0; i < demandes.length; i++) {
            forms.push(demandes[i].forms[0]);
        }

        res.status(200).send(forms)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.delete('/deletedemande/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;

        let deleteddemandeation = await Demande.findByIdAndDelete({ _id: id })

        if (!deleteddemandeation) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(deleteddemandeation);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.put('/updatedemande/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        let updateddemande = await Demande.findByIdAndUpdate({ _id: id },  { status: true  })
        
        if (!updateddemande) {
            res.status(404).send('not found')
        } else {
            res.status(200).send('accepted');
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
	console.log(error);
    }
});

module.exports = router;