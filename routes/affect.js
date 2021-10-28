const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { Affect } = require('../models/affect');
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
  

router.post('/addaffectation', verifyToken, async (req, res) => {

    try {
        let obj = req.body;
        let affectation = new Affect(obj);

        affectation.date = new Date();
        affectation.dateRemplissage = null;

        affectation.etat = false;
        let aff = await Affect.findOne({ user: obj.user, form: obj.form, doctor: obj.doctor })

        if (!aff) {
            let savedAffectation = await affectation.save()

            res.status(200).send({ affected: 1 });
        } else {
            res.status(200).send({ affected: 0 });
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getaffectation', verifyToken, async (req, res) => {

    try {
        let affectations = await Affect.find()
        res.status(200).send(affectations);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getaffect/:user/:form', verifyToken, async (req, res) => {

    try {
        let affectation = await Affect.findOne({ user: req.params.user, form: req.params.form })
        if (!affectation) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(affectation);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});



router.get('/getallform/:user/:doctor', verifyToken, async (req, res) => {

    try {
        let user = req.params.user;
        let doctor = req.params.doctor;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
                            doctor: ObjectId(doctor),
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

        let inCompletedForms = [];

        for (let i = 0; i < affect.length; i++) {
            let obj = {
                affectedOn: affect[i].date,
                filledOn: affect[i].dateRemplissage,
                form: affect[i].forms[0]
            }
            inCompletedForms.push(obj);
        }


        let affect1 = await Affect
        .aggregate(
            [
                {
                    $match: {
                        user: ObjectId(user),
                        doctor: ObjectId(doctor),
                        etat: true,
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

    let completedForms = [];

    for (let i = 0; i < affect1.length; i++) {
        let obj = {
            affectedOn: affect1[i].date,
            filledOn: affect1[i].dateRemplissage,
            form: affect1[i].forms[0]
        }
        completedForms.push(obj);
    }

    let forms = {
        completed : completedForms,
        incompleted: inCompletedForms
    }

        res.status(200).send(forms)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});








router.get('/getcompletedform/:user/:doctor', verifyToken, async (req, res) => {

    try {
        let user = req.params.user;
        let doctor = req.params.doctor;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
                            doctor: ObjectId(doctor),
                            etat: true,
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

        for (let i = 0; i < affect.length; i++) {

            let obj = {
                affectedOn: affect[i].date,
                filledOn: affect[i].dateRemplissage,
                form: affect[i].forms[0]
            }

            forms.push(obj);
        }

        res.status(200).send(forms)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getincompletedform/:user/:doctor', verifyToken, async (req, res) => {

    try {
        let user = req.params.user;
        let doctor = req.params.doctor;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
                            doctor: ObjectId(doctor),
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

        for (let i = 0; i < affect.length; i++) {
            let obj = {
                affectedOn: affect[i].date,
                filledOn: affect[i].dateRemplissage,
                form: affect[i].forms[0]
            }
            forms.push(obj);
        }

        res.status(200).send(forms)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getcompletedformbydoctor/:doctor', verifyToken, async (req, res) => {

    try {
        
        let doctor = req.params.doctor;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            
                            doctor: ObjectId(doctor),
                            etat: true,
                        }
                    },
                    {
                        $lookup: {
                            from: "patients",
                            localField: "user",
                            foreignField: "_id",
                            as: 'patients'
                        }
                    },
                    {
                        $unwind: "$patients"
                    },
                    {
                        $lookup: {
                            from: "forms",
                            localField: "form",
                            foreignField: "_id",
                            as: "patients.forms"
                        }
                    },
                    { $project : { 
 			_id: 0,
                        patients: 1, 
                        } 
		    }
                ]
            )

       
        res.status(200).send(affect)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});


router.get('/getallformbydoctor/:doctor', verifyToken, async (req, res) => {

    try {
        
        let doctor = req.params.doctor;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            
                            doctor: ObjectId(doctor),
                            
                        }
                    },
                    {
                        $lookup: {
                            from: "patients",
                            localField: "user",
                            foreignField: "_id",
                            as: 'patients'
                        }
                    },
                    {
                        $unwind: "$patients"
                    },
                    {
                        $lookup: {
                            from: "forms",
                            localField: "form",
                            foreignField: "_id",
                            as: "patients.forms"
                        }
                    },
                    { $project : { 
 			            _id: 0,
                        patients: 1, 
                        dateRemplissage:1
                        } 
		    }
                ]
            )

       
        res.status(200).send(affect)

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});





router.get('/getmyform/:user', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
                            etat: true,
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

        let completedForms = [];

        if(affect){
            for (let i = 0; i < affect.length; i++) {

                let obj = {
                    affectedOn: affect[i].date,
                    filledOn: affect[i].dateRemplissage,
                    form: affect[i].forms[0],
                    doctor: affect[i].doctors[0]
                }
                completedForms.push(obj);
            }
        }


        let affect1 = await Affect
        .aggregate(
            [
                {
                    $match: {
                        user: ObjectId(user),
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

    let inCompletedForms = [];

   if(affect1){
    for (let i = 0; i < affect1.length; i++) {

        let obj = {
            affectedOn: affect1[i].date,
            filledOn: affect1[i].dateRemplissage,
            form: affect1[i].forms[0],
            doctor: affect1[i].doctors[0]
        }
        inCompletedForms.push(obj);
    }
   }

    let forms = {
        completed : completedForms,
        incompleted: inCompletedForms
    }
        res.status(200).send(forms)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
	console.log(error);
    }
});

router.get('/getmycompletedform/:user', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;

        const ObjectId = mongoose.Types.ObjectId;

        let affect = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
                            etat: true,
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

        for (let i = 0; i < affect.length; i++) {

            let obj = {
                affectedOn: affect[i].date,
                filledOn: affect[i].dateRemplissage,
                form: affect[i].forms[0]
            }
            forms.push(obj);
        }
        res.status(200).send(forms)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getmyincompletedform/:user', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;

        const ObjectId = mongoose.Types.ObjectId;

        let affectations = await Affect
            .aggregate(
                [
                    {
                        $match: {
                            user: ObjectId(user),
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

        for (let i = 0; i < affectations.length; i++) {
            let obj = {
                affectedOn: affectations[i].date,
                filledOn: affectations[i].dateRemplissage,
                form: affectations[i].forms[0]
            }
            forms.push(obj);
        }
        res.send(forms)
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.delete('/deleteaffectation/:id', verifyToken, async (req, res) => {

    try {
        let id = req.params.id;

        let affectation = await Affect.findByIdAndDelete({ _id: id })

        if (!affectation) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(affectation);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.put('/updateaffectation/:id', verifyToken, async (req, res) => {

    try {
        let id = req.params.id;

        let affectation = await Affect.findByIdAndUpdate({ _id: id }, { $set: { etat: true } })

        if (!affectation) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(affectation);
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

module.exports = router;