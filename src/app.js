const express = require('express');
const AppError = require('./utils/appError');
const app = express();
const countryRouter = require('./routes/country.route');
const errorController = require('./controllers/error.controller');
const userRouter = require('./routes/user.route');
const whatsappRouter = require('./routes/whatsapp.route');
const portRouter = require('./routes/port.route');
const vesselRouter = require('./routes/vessel.route');
const coalRouter = require('./routes/coal.route');
const authRouter = require('./routes/auth.routes');
const bidRouter = require('./routes/bid.routes');
const messageRouter = require('./routes/message.routes');
const notificationRouter = require('./routes/notification.routes');
const suggestedBidRouter = require('./routes/suggestedBid.routes');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use('/api/countries', countryRouter);
app.use('/api/users', userRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/ports', portRouter);
app.use('/api/vessels', vesselRouter);
app.use('/api/coals', coalRouter);
app.use('/api/bids', bidRouter);
app.use('/api/messages', messageRouter);
app.use('/api', authRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/suggestedBids', suggestedBidRouter);

app.all('*', (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(errorController);

module.exports = app;
