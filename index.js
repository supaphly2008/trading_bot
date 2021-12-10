require("dotenv").config();
const ccxt = require("ccxt");
const axios = require("axios");

const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

class Bot {
  constructor(asset, base, allocation, spread, interval = 2000) {
    this.asset = asset;
    this.base = base;
    this.allocation = allocation;
    this.spread = spread;
    this.interval = interval;
  }

  async tick(binanceClient) {
    const market = `${this.asset}/${this.base}`;
    const orders = await binanceClient.fetchOpenOrders(market);

    const results = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${this.asset}${this.base}`);
    const marketPrice = results.data.price;
    this.showMarketPrice(marketPrice);
    const sellPrice = marketPrice * (1 + this.spread);
    const buyPrice = marketPrice * (1 - this.spread);

    // get all balance in your wallet
    const balance = await binanceClient.fetchBalance();
    const assetBalance = balance.free[this.asset];
    const baseBalance = balance.free[this.base];
    const volume = (baseBalance * this.allocation) / marketPrice;
    // const sellVolume = assetBalance * allocation;

    // await binanceClient.createLimitSellOrder(market, volume, sellPrice);
    // await binanceClient.createLimitBuyOrder(market, volume, buyPrice);
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

const bot1 = new Bot("BTC", "USDT", 0.2, 0.003);
bot1.run(binanceClient);
