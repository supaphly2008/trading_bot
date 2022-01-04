# Crypto trading bot

#### Info
- This app is a trading bot that buy low and sell high.
- You can set the parameter when initializing the bot object.
- The bot trades on Binance platform.
- Make sure you have sufficient amount of money to start trading.
- The app is built with Node.js

#### Environment Variables
- Create a `.env` file in root directory.
- Make sure you've signed up with Binance and are able to generate `api key` and `api secret key`.


Inside the `.env` file:
```
API_KEY: {YOUR API KEY}
API_SECRET: {YOUR API SECRET}
```

To run the app
```
node index.js
```


If you want the bot to run constantly then you need to host the app on the server so it doesn't get interrupted.
