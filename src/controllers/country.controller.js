const Country = require('../models/country.model');
const handlerFactory = require('../utils/handlerFactory');

exports.getAllCountries = handlerFactory.getAll(Country, 'name');
exports.getCountry = handlerFactory.getOne(Country);
exports.createCountry = handlerFactory.createOne(Country);
exports.updateCountry = handlerFactory.updateOne(Country);
exports.deleteCountry = handlerFactory.deleteOne(Country);
