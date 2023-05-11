require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const port = process.env.PORT || 5000;
const mongooseUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anmol';
mongoose
	.connect(mongooseUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Connected to MongoDB');
	});

app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
