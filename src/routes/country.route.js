const express = require('express');
const router = express.Router();
const countryController = require('../controllers/country.controller');

const { protect } = require('../controllers/auth.controller');

router.use(protect);

router
	.route('/')
	.get(countryController.getAllCountries)
	.post(countryController.createCountry);

router
	.route('/:id')
	.get(countryController.getCountry)
	.patch(countryController.updateCountry)
	.delete(countryController.deleteCountry);

module.exports = router;
