require("dotenv").config();
const ccxt = require("ccxt");
const axios = require("axios");

const app = require("express")();
const PORT = process.env.PORT || 5000;

const config = {
  asset: "BTC",
  base: "USDT",
  allocation: 0.2, // how much for each trade in percentage from portfolio
  spread: 0.003, // percentage that applies to the mid-rate to create buy/sell limit
  tickInterval: 5000,
};

const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

const tick = async (config, binanceClient) => {
  const { asset, base, allocation, spread } = config;
  const market = `${asset}/${base}`;

  const orders = await binanceClient.fetchOpenOrders(market);
  console.log(orders.length);
  // if (orders.length) {
  //   return;
  // }
  // orders.forEach(async (order) => {
  //   await binanceClient.cancelOrder(order.id, order.symbol);
  // });

  const results = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`);
  const marketPrice = results.data.price;
  console.log("marketPrice", marketPrice);
  const sellPrice = marketPrice * (1 + spread);
  const buyPrice = marketPrice * (1 - spread);

  // get all balance in your wallet
  const balance = await binanceClient.fetchBalance();
  const assetBalance = balance.free[asset];
  const baseBalance = balance.free[base];
  const volume = (baseBalance * allocation) / marketPrice;
  // const sellVolume = assetBalance * allocation;

  // await binanceClient.createLimitSellOrder(market, volume, sellPrice);
  // await binanceClient.createLimitBuyOrder(market, volume, buyPrice);

  console.log(`
    New tick for ${market}...
    Created limit sell order for ${volume}@${sellPrice}
    Created limit buy order for ${volume}@${buyPrice}
  `);
};

const run = (config, binanceClient) => {
  tick(config, binanceClient);
  setInterval(tick, config.tickInterval, config, binanceClient); // run tick function every 2 seconds
};

// express server
app.get("/", (req, res) => {
  res.send(`listening on port ${PORT}`);
});

app.listen(PORT, () => {
  run(config, binanceClient);
  console.log(`Server running on port ${PORT}`);
});
