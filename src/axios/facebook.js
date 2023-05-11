require('dotenv').config();
const axios = require('axios');

const facebook = axios.create({
	baseURL: process.env.FACEBOOK_BASE_URL || 'https://graph.facebook.com/v12.0/',
});

module.exports = facebook;
