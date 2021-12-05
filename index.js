require("dotenv").config();
const ccxt = require("ccxt");
const axios = require("axios");

const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

const tick = async (config, binanceClient) => {
  const { asset, base, allocation, spread } = config;
  const market = `${asset}/${base}`;

  const orders = await binanceClient.fetchOpenOrders(market);
  if (orders.length) {
    return;
  }
  // orders.forEach(async (order) => {
  //   await binanceClient.cancelOrder(order.id, order.symbol);
  // });

  // const results = await Promise.all([axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"), axios.get("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd")]);
  const results = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`);
  const marketPrice = results.data.price;
  console.log("marketPrice", marketPrice);
  const sellPrice = marketPrice * (1 + spread);
  const buyPrice = marketPrice * (1 - spread);
  // get all balance in your wallet
  const balance = await binanceClient.fetchBalance();
  const assetBalance = balance.free[asset];
  const baseBalance = balance.free[base];
  const buyVolume = (baseBalance * allocation) / marketPrice;
  const sellVolume = assetBalance * allocation;

  await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
  await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);

  console.log(`
    New tick for ${market}...
    Created limit sell order for ${sellVolume}@${sellPrice}
    Created limit buy order for ${buyVolume}@${buyPrice}
  `);
};

const run = () => {
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

  tick(config, binanceClient);
  setInterval(tick, config.tickInterval, config, binanceClient); // run tick function every 2 seconds
};

run();

express()
  .get("/", (req, res) => res.send(`Server running on port ${PORT}`))
  .listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const binanceClient = new ccxt.binance({
//   apiKey: "CtuhPLEeQ7MwJqvy415bEYROc8apWM6Cp7rYKicYymU8b5wCx1TZtJfwLuI5ZWjD",
//   secret: "hDNWwzlP8LNFVCtoSJ9vn2MtBwUVKmk9d5oZHqBZTKjQfMFEDMKeUjwP5HktxZFJ",
// });
// const market = "BTC/USDT";
// binanceClient.fetchOpenOrders(market).then((order) => {
//   console.log(order);
// });
