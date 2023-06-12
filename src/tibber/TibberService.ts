import { TibberQuery, IConfig } from 'tibber-api';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';

export class TibberService {

  private config: IConfig;
  private thresholdCnts: number; // threshold to lowest in cents

  constructor(tibberApiKey:string, tibberQueryUrl:string, thresholdCnts: number, tibberHomeId?: string){
    this.config = {
      // Endpoint configuration.
      apiEndpoint: {
        apiKey:  tibberApiKey, //'5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE', // Demo token
        queryUrl: tibberQueryUrl, //'wss://api.tibber.com/v1-beta/gql/subscriptions',
      },
      // Query configuration.
      homeId: tibberHomeId, // '96a14971-525a-4420-aae9-e5aedaa129ff',
      timestamp: true,
      power: true,
      active: true,
    };
    this.thresholdCnts = thresholdCnts;
  }

  async getTodaysEnergyPrices(): Promise<IPrice[]> {
    const tibberQuery = new TibberQuery(this.config);
    return tibberQuery.getTodaysEnergyPrices(this.config.homeId);
  }

  // determine lowest next price for the curent day
  findLowestPrice(prices: IPrice[]): number {
    let lowest = undefined;
    prices.forEach(price => {
      price.total;
      if (lowest===undefined){
        lowest = price.total;
      }else{
        if (price.total < lowest){
          lowest = price.total;
        }
      }
    });
    return lowest;
  }


  // determine lowest next price for the curent day
  async findCurrentPrice(): Promise<number> {
    const tibberQuery = new TibberQuery(this.config);
    const current = await tibberQuery.getCurrentEnergyPrice(this.config.homeId);
    return current.total;
  }

  // check if we are in the lowest price for today - if yes, pull the trigger
  //
  _getTrigger(todaysLowestPrice: number, currentPrice: number, socBattery: number, socLowerThreshold: number ): boolean {
    const diffToLowest = currentPrice - todaysLowestPrice;
    // diffToLowest is in acceptable range
    console.log('lowest today: ' + todaysLowestPrice + ' current: ' + currentPrice + ' diffToLowest ' + diffToLowest );
    if (diffToLowest <= this.thresholdCnts && socBattery >= socLowerThreshold ) {
      console.log('trigger true');
      return true;
    }
    console.log('trigger false');
    return false;
  }

  async getTrigger(socBattery: number, socLowerThreshold: number ): Promise<boolean> {
    const currentPrice = await this.findCurrentPrice();
    const todaysLowestPrice = this.findLowestPrice(await this.getTodaysEnergyPrices());
    return this._getTrigger(todaysLowestPrice, currentPrice, socBattery, socLowerThreshold);
  }

}
