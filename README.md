# MonnBot

Monnbot is a command-line interface for trading on Binance and FTX. It was designed to make it easy to manage my trades and monitor spreads from the command line. However, due to the falling out of FTX, this CLI is no longer functional. I also had a [dashboard](https://github.com/RyanMoreau/monnbot-dashboard) and [server](https://github.com/RyanMoreau/monnbot-server) which provided me quick insights on each pair and both the spread and funding rate, as well as a section that provided great cash and carry opportunities. 

I have decided to open source this project so that others can learn from it and build their own trading systems using [OCLIF](https://oclif.io/). One of the biggest lessons I learned was the importance of Casino Model, and how having multiple orders over a longer period of time can help you execute your preferred range.

## What is the goal of trading spreads?

In crypto markets, there's a concept of Funding Rates. A crypto funding rate is a small percentage of your position's value that you pay to (or receive from) traders on the other side of the trade. Generally, shorts pay longs if the trend is up, and longs pay shorts if the trend is down. Most exchanges use funding rate payment intervals of 1, 4, or 8 hours. 

Having the ability to hedge yourself (with Monnbot) and taking the opposite side of the trade was quite literally the definition of passive income. That, and the ability to make a 0.2% gain from a spread (when leveraged 10x that's 2%) was a great, albeit highly degen way of making a pretty consistent return.

## Commands

Monnbot comes with a range of commands that make it easy to manage your trades and monitor the markets. Here are some of the available commands:

- `buypf`: Buys the spread of PERP/FUT pairs.
- `buypu`: Buys the spread of PERP/USD pairs.
- `buyuf`: Buys the spread of USD/FUT pairs.
- `calculate`: Tool for building your ideal position
- `pepe`: Everybody loves the frog
- `positions`: Fetch open positions & account data
- `range`: Get the range between 2 pairs. Ideal for running over long periods of time to get the best available entry.
- `sellpf`: Sells the spread of PERP/FUT pairs
- `sellpu`: Sells the spread of PERP/USD pairs.
- `selluf`: Sells the spread of USD/FUT pairs.
- `spread`: Spread Scalper when there's a lot of volatility.

## Archived Screengrabs

**Discord Alert System**

![Screenshot 2023-09-27 at 3 24 18 PM](https://github.com/RyanMoreau/monnbot/assets/3619317/18a23780-03f5-4f47-985e-e2c33c47c3a0)

**Dashboard View**

![dashboard](https://github.com/RyanMoreau/monnbot/assets/3619317/28f30a0e-e3b0-4dc5-81dd-73b98f5f2cf5)

**Charting A Spread**

![spread](https://github.com/RyanMoreau/monnbot/assets/3619317/d2998a3a-fb39-4f8d-90a5-569dd5af047c)
![monnbot13](https://github.com/RyanMoreau/monnbot/assets/3619317/66235de1-9380-4d01-ae97-349d21b598e3)

**CLI View**

![CLI_view](https://github.com/RyanMoreau/monnbot/assets/3619317/360a5961-d8d2-4124-9635-a20614a38f3c)
![monnbot4](https://github.com/RyanMoreau/monnbot/assets/3619317/d1095baa-7f66-4af9-9064-a1be11282fa0)

**Pairs Arb**

![monnbot12](https://github.com/RyanMoreau/monnbot/assets/3619317/c35bbe44-b8db-4ea5-b673-d92640a29060)

