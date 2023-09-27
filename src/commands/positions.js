const { Command, flags } = require("@oclif/command");
const ccxtpro = require ('ccxt.pro')
var _ = require('underscore');
var numeral = require('numeral');
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');

class GetPositions extends Command {
  // Flag for sub
  static flags = {
    sub: flags.string({
      description: 'specify a sub account if any'
    }),
  };

  async run() {
    let ftx = new ccxtpro.ftx({
      verbose: false,
      apiKey: keys.key,
      secret: keys.secret,
      enableRateLimit: true,
    });
    const { flags } = this.parse(GetPositions);
    // Conditional Logic For Flag
    if (flags.sub != null) {
      ftx.headers = {
        "FTX-SUBACCOUNT": flags.sub,
      };
      console.log(
        `${colors.FgYellow}${flags.sub} subaccount active${colors.Reset}`
      );
    }

    // Get Account Balance
    async function accountBalance() {
      // Fetch Data
      const positions = await ftx.fetchPositions();
      const balances = await ftx.fetchBalance();
      const markets = await ftx.loadMarkets();
      const accountDetails = await ftx.privateGetAccount();

      // Print Futures Balances
      console.log(`${colors.FgCyan}Futures:${colors.Reset}`);
      const activePositions = []
      const futCost = []
      await Promise.all(
        positions.map(async (p) => {
          if (p.size > 0) {
            activePositions.push(p.future.split('-')[0])
            futCost.push(parseInt(p.collateralUsed))
            console.log(
              `${p.future}: ${p.side} @ ${numeral(p.entryPrice).format('$0, $0.00')}, openSize ${p.openSize}, Cost: ${numeral(p.cost).format('$0, $0.00')}, collateralUsed: ${numeral(p.collateralUsed).format('$0, $0.00')}, leverage: ${Math.round(p.cost / p.collateralUsed)}x`
            );
          }
        })
      );
      const positionCollateral = futCost.reduce((sum, x) => sum + x);

      // Active Positions (Remove Duplicates & Contract Type)
      let positionList = _.uniq(activePositions, false)

      // Print Spot Balances
      console.log(`${colors.FgCyan}Spot:${colors.Reset}`);
      console.log(`USD: ${numeral(balances.total['USD']).format('$0, $0.00')}`)
      const spotCost = []
      positionList.forEach(pl => {
        if(typeof balances.total[`${pl}`] !== 'undefined' && balances.total[`${pl}`] !== 0) {
          console.log(`${pl}: ${balances.total[`${pl}`]} (${numeral(ftx.markets[`${pl}/USD`].info.price * balances.total[`${pl}`]).format('$0, $0.00')})`)
          spotCost.push(ftx.markets[`${pl}/USD`].info.price * balances.total[`${pl}`])
        }
      });

      // Print Account Overview
      let balance = balances.total['USD']
      console.log(`${colors.FgCyan}Account Overview:${colors.Reset}`)
      console.log(`Balance: ${numeral(balance + (spotCost.reduce((a, b) => a + b, 0))).format('$0, $0.00')}`)
      console.log(`Free: ${numeral(accountDetails.result.freeCollateral).format('$0, $0.00')}`)
      {/* GET ACCOUNT LEVERAGE? */}
      console.log(`Margin Fraction: ${JSON.stringify(accountDetails.result.marginFraction * 100).slice(0,5)}%`)
      console.log(`Margin Requirement: ${JSON.stringify(accountDetails.result.maintenanceMarginRequirement * 100).slice(0,5)}%`)
    }
    accountBalance();

  }
}

// Descriptor
GetPositions.description = `Positions & Account Data`;

// Export Command
module.exports = GetPositions;