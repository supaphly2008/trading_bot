require("dotenv").config();
const ccxt = require("ccxt");
const axios = require("axios");

const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

class Bot {
  constructor(asset, base, amount, spread, interval = 2000) {
    this.asset = asset;
    this.base = base;
    this.amount = amount;
    this.spread = spread;
    this.interval = interval;
    this.myOrders = [];
    this.sellInfo = [];
  }

  async tick(binanceClient) {
    // trading pair
    const market = `${this.asset}/${this.base}`;
    // get all the orders
    const orders = await binanceClient.fetchOpenOrders(market);

    // get market price
    const results = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${this.asset}${this.base}`);
    const marketPrice = results.data.price;
    this.showMarketPrice(marketPrice);

    // set buy/sell price
    const sellPrice = marketPrice * (1 + this.spread);
    const buyPrice = marketPrice * (1 - this.spread);

    // get all balance in your wallet
    // const balance = await binanceClient.fetchBalance();
    // const assetBalance = balance.free[this.asset];
    // const baseBalance = balance.free[this.base];

    const volume = this.amount / buyPrice;

    // create limit buy
    for (let i = 1; i <= 3; i++) {
      const res = await binanceClient.createLimitBuyOrder(market, this.amount / (marketPrice * (1 - this.spread * i)), marketPrice * (1 - this.spread * i));
      this.myOrders.push({
        id: res.id,
        side: res.side,
        price: res.price,
        amount: res.amount,
      });
    }

    this.sellInfo = [
      {
        amount: this.myOrders[0].amount,
        price: (20 / this.myOrders[0].amount) * 1.1,
      },
      {
        amount: this.myOrders[0].amount + this.myOrders[1].amount,
        price: (40 / (this.myOrders[0].amount + this.myOrders[1].amount)) * 1.1,
      },
      {
        amount: this.myOrders[0].amount + this.myOrders[1].amount + this.myOrders[2].amount,
        price: (60 / (this.myOrders[0].amount + this.myOrders[1].amount + this.myOrders[2].amount)) * 1.1,
      },
    ];
    console.log("my orders", this.myOrders);
    console.log("sell info", this.sellInfo);

    // check if order length === 2
    // create limit sell
    if (orders.length === 2) {
      const res = await binanceClient.createLimitSellOrder(market, this.myOrders[0].amount, this.myOrders[0].price * 1.1);
      this.myOrders.push({
        id: res.id,
        side: res.side,
        price: res.price,
        amount: res.amount,
      });
    }

    this.showTicketCreatedMessage(market, volume, sellPrice, buyPrice);
  }

  showMarketPrice(marketPrice) {
    console.log(`Market price for ${this.asset}/${this.base}: ${marketPrice}`);
  }
  showTicketCreatedMessage(market, volume, sellPrice, buyPrice) {
    console.log(`
    New tick for ${market}...
    Created limit sell order for ${volume.toFixed(6)}${this.asset} @ ${sellPrice.toFixed(6)}${this.base}
    Created limit buy order for ${volume.toFixed(6)}${this.asset} @ ${buyPrice.toFixed(6)}${this.base}
  `);
  }
  run(binanceClient) {
    this.tick(binanceClient);
    setInterval(() => {
      this.tick(binanceClient);
    }, this.interval);
  }
}

/**
 * Bot constructor
 * @constructor
 * @param {string} asset - token you want to buy
 * @param {string} base - token you are buying with
 * @param {number} amount - amount you want to spend when bot creates a limit buy
 * @param {number} spread - % drop when bot creates a buy order
 */
const bot1 = new Bot("BTC", "USDT", 20, 0.1);
bot1.run(binanceClient);
