require("dotenv").config();
const ccxt = require("ccxt");
const axios = require("axios");

const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

class Bot {
  constructor(asset, base, amount, spread, interval = 5000) {
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
    if (orders.length) {
      return;
    }

    // get market price
    const results = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${this.asset}${this.base}`);
    const marketPrice = results.data.price;
    this.showMarketPrice(marketPrice);

    // set buy/sell price
    const sellPrice = marketPrice * (1 + this.spread);
    const buyPrice = marketPrice * (1 - this.spread);

    // const balance = await binanceClient.fetchBalance();
    // const assetBalance = balance.free[this.asset];
    // const baseBalance = balance.free[this.base];

    const volume = this.amount / marketPrice;

    await binanceClient.createLimitBuyOrder(market, volume, buyPrice);
    await binanceClient.createLimitSellOrder(market, volume, sellPrice);

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
const bot1 = new Bot("BTC", "USDT", 20, 0.003);
bot1.run(binanceClient);
