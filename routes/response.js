const express = require('express');
const jwt = require('jsonwebtoken');

const { Affect } = require('../models/affect');
const { Response } = require('../models/response');
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
  




router.post('/addresponse', verifyToken, async (req, res) => {

    try {
        let obj = req.body;

        let responses = new Response(obj);


        responses.created_date = new Date();
        responses.archived = false;
        let sc = 0;
        for(let r of responses.responses){
            for(let op of r.options){
                if(op.selected){
                    sc = sc + op.score;
                }
            }
        }

        responses.score = sc;
        let savedresponses = await responses.save()

        await Affect.findOneAndUpdate({ user: savedresponses.user, form: savedresponses.form },
            { $set: { dateRemplissage: new Date(), etat: true } }
        )

        res.status(200).send(savedresponses);

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.get('/getresponses', verifyToken, async (req, res) => {

    try {
        let responses = await Response.find({ archived: false })

        res.status(200).send(responses);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }

});

router.delete('/deleteresponses/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;

        let deletedresponses = await Response.findByIdAndDelete({ _id: id })

        if (!deletedresponses) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(deletedresponses);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.put('/updateresponses/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        let data = req.body

        let updatedresponses = await Response
            .findByIdAndUpdate({ _id: id }, {
                $set: {
                    user: data.user,
                    doctor: data.doctor,
                    created_date: data.created_date,
                    responses: data.responses,
                    archived: data.archived,
                    form: data.form
                }
            })

        if (!updatedresponses) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(updatedresponses);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/archived/:id', verifyToken, async (req, res) => {
    try {
        let updatedresponses = await Response.findByIdAndUpdate({ _id: id }, { $set: { archived: true } })
        if (!updatedresponses) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(updatedresponses);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getresponsesbyid/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;

        let responses = await Response.findOne({ _id: id })

        if (!responses) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(responses);
        }

    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/check/:user/:form', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;
        let form = req.params.form;

        let responses = await Response.findOne({ user: user, form: form })

        if (!responses) {
            res.status(404).send('not found')
        } else {
            res.status(200).send(responses);
        }
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getformresponse/:user/:form', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;
        let form = req.params.form;

        let responses = await Response.find({ doctor: user, form: form })

        res.status(200).send(responses);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

router.get('/getuserformresponse/:user/:doctor/:form', verifyToken, async (req, res) => {
    try {
        let user = req.params.user;
        let form = req.params.form;
        let doctor = req.params.doctor;


        let responses = await Response.findOne({ doctor: doctor, form: form ,user: user  })

        res.status(200).send(responses);
    } catch (error) {
        res.status(400).send({ message: "Erreur", error });
    }
});

module.exports = router;