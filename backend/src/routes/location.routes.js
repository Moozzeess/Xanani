const express = require('express');
const router = express.Router();

const locationController = require('../controllers/location.controller');

router.post('/', locationController.registerLocation);

module.exports = router;