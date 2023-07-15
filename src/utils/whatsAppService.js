require('dotenv').config();
const Message = require('../models/message.model');
const facebookAxios = require('../axios/facebook');
const Coal = require('../models/coal.model');
const Bid = require('../models/bid.model');

class WhatsAppService {
	constructor(token, phoneNumberId, user, botUser, currentBid, io) {
		this.token = token;
		this.phoneNumberId = phoneNumberId;
		this.user = user;
		this.botUser = botUser;
		this.currentBid = currentBid;
		this.io = io;
	}

	async sendMessage(type, message) {
		let res = await facebookAxios.post(
			'/' + this.phoneNumberId + '/messages?access_token=' + this.token,
			{
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: this.user.phone,
				type: type,
				[type]: message,
			}
		);

		this.saveMessage(type, message, res.data.messages[0].id);

		return res;
	}

	async sendTextMessage(message) {
		return await this.sendMessage('text', {
			preview_url: false,
			body: message,
		});
	}

	saveMessage(type, message, wamid) {
		let msg = '';

		if (type === 'text') {
			msg = message.body;
		} else if (type === 'interactive') {
			msg = message.body.text;
		}

		Message.create({
			to: this.user._id,
			from: this.botUser._id,
			type: type,
			message: msg,
			wamid: wamid,
			timestamps: Date.now(),
		}).then((message) => {
			if (this.io) this.io.emit('message', message);
		});
	}

	async sendWelcomeMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `Hi ${this.user.name},\nWelcome to Anmol India's WhatsApp Bot\n\nThis bot will help you to place bids for coal.\n\nBefore we proceed, please provide us with your details.`,
		});
	}

	async sendMenuMessage() {
		return await this.sendMessage('interactive', {
			type: 'button',
			body: {
				text: `Hi ${this.user.name},\nWelcome to Anmol India's WhatsApp Bot\n\nThis bot will help you to place bids for coal.\n\nPlease select one of the following options to proceed.`,
			},
			action: {
				buttons: [
					{
						type: 'reply',
						reply: {
							id: 'PLACE_BID',
							title: 'Place a Bid',
						},
					},
					{
						type: 'reply',
						reply: {
							id: 'CALL_BACK',
							title: 'Request a Call Back',
						},
					},
				],
			},
		});
	}

	async sendCallBackMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: 'Your request for call back has been received. Our representative will contact you shortly.',
		});
	}

	async sendAskNameMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `What's your name?`,
		});
	}

	async sendAskCompanyMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `What's your company name?`,
		});
	}

	async sendBidTypeMessage() {
		return await this.sendMessage('interactive', {
			type: 'button',
			body: {
				text: 'What type of bid do you want to place?',
			},
			action: {
				buttons: [
					{
						type: 'reply',
						reply: {
							id: 'BUY',
							title: 'Buy',
						},
					},
					{
						type: 'reply',
						reply: {
							id: 'SELL',
							title: 'Sell',
						},
					},
				],
			},
		});
	}

	async sendVesselsListMessage() {
		let coals = await Coal.find({ bidding: true }).populate(
			'country port vessel'
		);

		let bids = await Bid.find({
			user: this.user._id,
			status: 'pending',
		}).populate('coal');

		// remove coals which are already bidded by user
		coals = coals.filter((coal) => {
			let bid = bids.find((bid) => {
				return bid.coal._id.toString() === coal._id.toString();
			});
			return !bid;
		});

		let countries = coals.map((coal) => {
			return coal.country.name;
		});

		countries = [...new Set(countries)];

		countries = countries.map((country) => {
			return {
				name: country,
				vessels: coals.filter((coal) => {
					return coal.country.name === country;
				}),
			};
		});

		await this.sendMessage('interactive', {
			type: 'list',
			header: {
				type: 'text',
				text: 'Selct Vessel',
			},
			body: {
				text: 'Select any vessel from the list',
			},
			footer: {
				text: 'Powered by CoalMantra',
			},
			action: {
				button: 'Show Vessels',
				sections: countries.map((country) => {
					return {
						title: country.name,
						rows: country.vessels.map((coal) => {
							return {
								id: coal.vessel._id,
								title: coal.vessel.name,
								description: `Port - ${coal.port.name} | NAR - ${coal.NAR} | GAR - ${coal.GAR} | Indicative Price - ${coal.indicativePrice}`,
							};
						}),
					};
				}),
			},
		});
	}

	async sendCoalNotAvailableMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `No coal available for the selected vessel`,
		});
	}

	async sendAlreadyPlacedBidMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `You have already placed a bid for selected vessel`,
		});
	}

	async sendCoalDetailsMessage() {
		let coal = this.currentBid.coal;

		return await this.sendMessage('text', {
			preview_url: false,
			body: `
      Port - *${coal.port.name.toUpperCase()}*\nCountry - ${
				coal.country.name
			}\nVessel - ${coal.vessel.name}\n\nIndicative Price - *Rs. ${
				coal.indicativePrice
			}*\n${
				this.currentBid.type === 'BUY'
					? 'Minimum Price - *Rs. ' + coal.minPrice + '*'
					: 'Maximum Price - *Rs.' + coal.maxPrice + '*'
			}\n\nMinimum Order Quantity - *${
				coal.minQuantity
			}MT*\nMaximum Order Quantity - *${
				coal.maxQuantity
			}MT*\nValidity - *${Math.floor(coal.validity / 60)} Hours ${
				coal.validity % 60
			} Minutes*`,
		});
	}

	async sendAskQuantityMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `How much *Quantity* do you want to order?`,
		});
	}

	async sendValidQuantityMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `Please enter a valid quantity`,
		});
	}

	async sendQuantityNotInRangeMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `Please enter a quantity between ${bid.coal.minQuantity} and ${bid.coal.maxQuantity}`,
		});
	}

	async sendAskPriceMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `At what price do you want to place the bid?`,
		});
	}

	async sendValidPriceMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `Please enter a valid price`,
		});
	}

	async sendBidOverviewMessage() {
		return await this.sendMessage('text', {
			preview_url: false,
			body: `Port - *${this.currentBid.coal.port.name.toUpperCase()}*\nCountry - *${this.currentBid.coal.country.name.toUpperCase()}*\nVessel - *${this.currentBid.coal.vessel.name.toUpperCase()}*\n\nBid Type - *${this.currentBid.type.toUpperCase()}*\nQuantity - *${
				this.currentBid.quantity
			}MT*\nPrice - *Rs. ${this.currentBid.price}*\n
      `,
		});
	}

	async sendSuggestedBidsMessage(suggestedBids) {
		console.log(suggestedBids);
		suggestedBids = suggestedBids.map((suggestedBid) => {
			return this.sendMessage('interactive', {
				type: 'button',
				body: {
					text: `Country - *${suggestedBid.coal.country.name}*\nPort - *${
						suggestedBid.coal.port.name
					}*\nVessel - *${suggestedBid.coal.vessel.name}*\nQuantity - *${
						suggestedBid.quantity
					} MT* \nPrice - *Rs. ${suggestedBid.price}*\nValidity - *${Math.floor(
						suggestedBid.coal.validity / 60
					)} Hours ${suggestedBid.coal.validity % 60} Minutes*`,
				},
				action: {
					buttons: [
						{
							type: 'reply',
							reply: {
								id: suggestedBid._id,
								title: 'Submit Bid',
							},
						},
					],
				},
			});
		});

		return await Promise.all(suggestedBids);
	}

	async sendCustomBidMessage() {
		return await this.sendMessage('interactive', {
			type: 'button',
			body: {
				text: 'Do you want to place a custom bid?',
			},
			action: {
				buttons: [
					{
						type: 'reply',
						reply: {
							id: 'CUSTOM_BID',
							title: 'Yes',
						},
					},
				],
			},
		});
	}
}

module.exports = WhatsAppService;
