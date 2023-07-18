require("dotenv").config();
const Message = require("../models/message.model");
const facebookAxios = require("../axios/facebook");
const Coal = require("../models/coal.model");
const CoalOption = require("../models/coalOption.model");
const Bid = require("../models/bid.model");
const PaymentTerm = require("../models/paymentTerms.model");
const liftingPeriod = require("../models/liftingPeriod.model");

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
      "/" + this.phoneNumberId + "/messages?access_token=" + this.token,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: this.user.phone,
        type: type,
        [type]: message,
      }
    );

    this.saveMessage(type, message, res.data.messages[0].id);

    return res;
  }

  async sendTextMessage(message) {
    return await this.sendMessage("text", {
      preview_url: false,
      body: message,
    });
  }

  saveMessage(type, message, wamid) {
    let msg = "";

    if (type === "text") {
      msg = message.body;
    } else if (type === "interactive") {
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
      if (this.io) this.io.emit("message", message);
    });
  }

  async sendWelcomeMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Hi ${this.user.name},\nWelcome to Anmol India's WhatsApp Bot\n\nThis bot will help you to place bids for coal.\n\nBefore we proceed, please provide us with your details.`,
    });
  }

  async sendMenuMessage() {
    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: `Hi There,\nWelcome to Anmol India's WhatsApp Bot\n\nThis bot will help you to place bids for coal.\n\nPlease select one of the following options to proceed.`,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "PLACE_BID",
              title: "Place a Bid",
            },
          },
          {
            type: "reply",
            reply: {
              id: "CALL_BACK",
              title: "Request a Call Back",
            },
          },
        ],
      },
    });
  }

  async sendCallBackMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: "Your request for call back has been received. Our representative will contact you shortly.",
    });
  }

  async sendAskNameMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `What's your name?`,
    });
  }

  async sendAskCompanyMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `What's your company name?`,
    });
  }

  async sendBidTypeMessage() {
    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: "What type of bid do you want to place?",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "BUY",
              title: "Buy",
            },
          },
          {
            type: "reply",
            reply: {
              id: "SELL",
              title: "Sell",
            },
          },
          {
            type: "reply",
            reply: {
              id: "CALL_BACK",
              title: "Request a Call Back",
            },
          },
        ],
      },
    });
  }

  async sendCoalOptionsListMessage() {
    let coals = await CoalOption.find({}).populate({
      path: "coals",
      populate: {
        path: "country port vessel",
      },
    });

    // let countries = coals.map((coal) => {
    //   return coal.country.name;
    // });

    // countries = [...new Set(countries)];

    // countries = countries.map((country) => {
    //   return {
    //     name: country,
    //     vessels: coals.filter((coal) => {
    //       return coal.country.name === country;
    //     }),
    //   };
    // });

    await this.sendMessage("interactive", {
      type: "list",
      header: {
        type: "text",
        text: "Selct Vessel",
      },
      body: {
        text: "Select any vessel from the list",
      },
      footer: {
        text: "Powered by CoalMantra",
      },
      action: {
        button: "Show Vessels",
        sections: [
          {
            title: "All Options",
            rows: coals.map((coal) => {
              return {
                id: coal._id,
                title: coal.coals
                  .map((coal) => {
                    return coal.vessel.name;
                  })
                  .join(" Or "),
                description: "",
              };
            }),
          },
        ],
      },
    });
  }

  // async sendVesselsListMessage() {
  //   let coals = await Coal.find({ bidding: true }).populate(
  //     "country port vessel"
  //   );

  //   let bids = await Bid.find({
  //     user: this.user._id,
  //     status: "pending",
  //   }).populate("coal");

  //   // remove coals which are already bidded by user
  //   coals = coals.filter((coal) => {
  //     let bid = bids.find((bid) => {
  //       return bid.coal._id.toString() === coal._id.toString();
  //     });
  //     return !bid;
  //   });

  //   let countries = coals.map((coal) => {
  //     return coal.country.name;
  //   });

  //   countries = [...new Set(countries)];

  //   countries = countries.map((country) => {
  //     return {
  //       name: country,
  //       vessels: coals.filter((coal) => {
  //         return coal.country.name === country;
  //       }),
  //     };
  //   });

  //   await this.sendMessage("interactive", {
  //     type: "list",
  //     header: {
  //       type: "text",
  //       text: "Selct Vessel",
  //     },
  //     body: {
  //       text: "Select any vessel from the list",
  //     },
  //     footer: {
  //       text: "Powered by CoalMantra",
  //     },
  //     action: {
  //       button: "Show Vessels",
  //       sections: countries.map((country) => {
  //         return {
  //           title: country.name,
  //           rows: country.vessels.map((coal) => {
  //             return {
  //               id: coal.vessel._id,
  //               title: coal.vessel.name,
  //               description: `Port - ${coal.port.name} | NAR - ${coal.NAR} | GAR - ${coal.GAR} | Indicative Price - ${coal.indicativePrice}`,
  //             };
  //           }),
  //         };
  //       }),
  //     },
  //   });
  // }

  async sendCoalNotAvailableMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `No coal available for the selected vessel`,
    });
  }

  async sendAlreadyPlacedBidMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `You have already placed a bid for selected vessel`,
    });
  }

  // async sendCoalDetailsMessage() {
  //   let coal = this.currentBid.coal;

  //   return await this.sendMessage("text", {
  //     preview_url: false,
  //     body: `
  //     Port - *${coal.port.name.toUpperCase()}*\nCountry - ${
  //       coal.country.name
  //     }\nVessel - ${coal.vessel.name}\n\nIndicative Price - *Rs. ${
  //       coal.indicativePrice
  //     }*\n${
  //       this.currentBid.type === "BUY"
  //         ? "Minimum Price - *Rs. " + coal.minPrice + "*"
  //         : "Maximum Price - *Rs." + coal.maxPrice + "*"
  //     }\n\nMinimum Order Quantity - *${
  //       coal.minQuantity
  //     }MT*\nMaximum Order Quantity - *${
  //       coal.maxQuantity
  //     }MT*\nValidity - *${Math.floor(coal.validity / 60)} Hours ${
  //       coal.validity % 60
  //     } Minutes*`,
  //   });
  // }

  async sendAskQuantityMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Enter the quantity`,
    });
  }

  async sendValidQuantityMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Please enter a valid quantity`,
    });
  }

  async sendAskQuantityUnitMessage() {
    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: `Select the quantity unit`,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "MT",
              title: "MT",
            },
          },
          {
            type: "reply",
            reply: {
              id: "Truck",
              title: "Truck",
            },
          },
        ],
      },
    });
  }

  async sendQuantityNotInRangeMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Please enter a quantity between ${this.currentBid.coal.minQuantity} and ${this.currentBid.coal.maxQuantity}`,
    });
  }

  async sendAskPriceMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `At what price do you want to place the bid?`,
    });
  }

  async sendAskLiftingPeriodMessage() {
    let liftingPeriods = await liftingPeriod.find({});
    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: "Select the lifting period",
      },
      action: {
        buttons: liftingPeriods.map((liftingPeriod) => {
          return {
            type: "reply",
            reply: {
              id: liftingPeriod.name,
              title: liftingPeriod.name,
            },
          };
        }),
      },
    });
  }

  async sendAskPaymentTermsMessage() {
    const paymentTerms = await PaymentTerm.find({});

    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: `Please select the payment terms`,
      },
      action: {
        buttons: [
          ...paymentTerms.map((paymentTerm) => {
            return {
              type: "reply",
              reply: {
                id: paymentTerm.name,
                title: paymentTerm.name,
              },
            };
          }),
          {
            type: "reply",
            reply: {
              id: "CUSTOM_PAYMENT_TERMS",
              title: "Others",
            },
          },
        ],
      },
    });
  }

  async sendCustomPaymentTermsMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Please enter how much advance payment you can make?`,
    });
  }

  async sendValidPriceMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Please enter a valid price`,
    });
  }

  async sendBidOverviewMessage() {
    return await this.sendMessage("text", {
      preview_url: false,
      body: `Coal - *${this.currentBid.coal.coals
        .map((coal) => coal.vessel.name)
        .join(" or ")}*\nQuantity - *${this.currentBid.quantity} ${
        this.currentBid.coal.quantityUnit
      }*\nPrice - *Rs. ${this.currentBid.price}*\nLifting Period  - *${
        this.currentBid.liftingPeriod
      }*\nPayment - *${this.currentBid.paymentTerms}*\n
      `,
    });
  }

  // async sendSuggestedBidsMessage(suggestedBids) {
  //   console.log(suggestedBids);
  //   suggestedBids = suggestedBids.map((suggestedBid) => {
  //     return this.sendMessage("interactive", {
  //       type: "button",
  //       body: {
  //         text: `Country - *${suggestedBid.coal.country.name}*\nPort - *${
  //           suggestedBid.coal.port.name
  //         }*\nVessel - *${suggestedBid.coal.vessel.name}*\nQuantity - *${
  //           suggestedBid.quantity
  //         } MT* \nPrice - *Rs. ${suggestedBid.price}*\nValidity - *${Math.floor(
  //           suggestedBid.coal.validity / 60
  //         )} Hours ${suggestedBid.coal.validity % 60} Minutes*`,
  //       },
  //       action: {
  //         buttons: [
  //           {
  //             type: "reply",
  //             reply: {
  //               id: suggestedBid._id,
  //               title: "Submit Bid",
  //             },
  //           },
  //         ],
  //       },
  //     });
  //   });

  //   return await Promise.all(suggestedBids);
  // }

  async sendCustomBidMessage() {
    return await this.sendMessage("interactive", {
      type: "button",
      body: {
        text: "Do you want to place a custom bid?",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "CUSTOM_BID",
              title: "Yes",
            },
          },
        ],
      },
    });
  }
}

module.exports = WhatsAppService;
