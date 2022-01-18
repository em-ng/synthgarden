const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Sample = require("../../models/Sample");
const validateSampleInput = require("../../validation/samples");

router.post('/',
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        const { isValid, errors } = validateSampleInput(req.body);

        if(!isValid) {
            return res.status(400).json(errors);
        }

        const newSample = new Sample({
            user: req.user.id,
            name: req.body.name 
        })

        newSample
            .save()
            .then(sample => res.json(sample))
})

//showing all the sampples
router.get('/', (req, res) => {
    Sample.find()
        .then(samples => res.json(samples))
        .catch(err => res.status(404).json({ nosamplesfound: '' }));
});

//showing all the samples under a specific user
router.get('/user/:user_id', (req, res) => {
    Sample.find({user: req.params.user_id})
        .then(samples => res.json(samples))
        .catch(err =>
            res.status(404).json({ nosamplesfound: 'No samples found from that user' }
        )
    );
});

//showing a specific sample
router.get('/:id', (req, res) => {
    Sample.findById(req.params.id)
        .then(sample => res.json(sample))
        .catch(err =>
            res.status(404).json({ nosamplefound: 'No sample found with that ID' })
        );
});

module.exports = router;