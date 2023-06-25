import { TibberQuery, IConfig } from 'tibber-api';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { PriceTrigger } from '../interfaces';
import { Logging } from 'homebridge';

export class TibberService {
  private config: IConfig;
  private thresholdCnts: number; // threshold to lowest in cents
  private dailyMap: Map<number, PriceTrigger>;
  private tibberHomeId: string ;
  private lastClearDate: Date ;
  private logger: Logging;

  constructor(logger:Logging, tibberApiKey:string, tibberQueryUrl:string, thresholdCnts: number, tibberHomeId?: string){
    this.config = {
      // Endpoint configuration
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
    this.dailyMap = new Map();
    this.tibberHomeId= tibberHomeId;
    this.lastClearDate = new Date() ;
    this.lastClearDate.setHours(23);
    this.logger = logger;
  }

  getDailyMap(): Map<number, PriceTrigger>{
    return this.dailyMap;
  }

  async getTodaysEnergyPrices(): Promise<IPrice[]> {
    const tibberQuery = new TibberQuery(this.config);
    return new Promise((resolve, reject) => {
      tibberQuery.getHomes().then( homes => {
        const homeId = this.tibberHomeId !== undefined ? this.tibberHomeId : homes[0].id;
        return resolve(tibberQuery.getTodaysEnergyPrices(homeId));
      }).catch( error => {
        this.logger.debug('could not collect home ids ', error);
        return reject();
      }).catch(err => {
        this.logger.debug('could not collect todays energy prices ', err);
      });
    });

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
    return new Promise((resolve, reject) => {

      tibberQuery.getHomes().then( homes => {
        const homeId = this.tibberHomeId !== undefined ? this.tibberHomeId : homes[0].id;
        tibberQuery.getCurrentEnergyPrice(homeId).then(current => {
          return resolve(current.total);
        } ).
          catch(error => {
            this.logger.debug('Tibber: Could not fetch prices: statusMessage:' + error.statusMessage + ' errorCode:' +error.statusCode);
            return reject();
          },
          );
      }).catch(err => {
        this.logger.debug('could not fetch home ids ' + err);
      });
    });
  }


  async isTriggered(socCurrent: number /** Current SOC of battery */,
    socLowerThreshold: number /** SOC of battery to be trigger */ ): Promise<boolean> {

    return new Promise((resolve, reject) => {
      this.findCurrentPrice().then( currentPrice => {
        this.getTodaysEnergyPrices().then(todaysEnergyPrices=> {
          const todaysLowestPrice = this.findLowestPrice(todaysEnergyPrices );
          const isTriggered= this._getTrigger(todaysLowestPrice, currentPrice, socCurrent, socLowerThreshold);
          const now = new Date();
          const hours = now.getHours();
          const min = now.getMinutes();
          const index = hours * 4 + Math.round(min/15);

          const currentIndex = hours * 4 + Math.round(min/15);

          this.dailyMap.set(index, new PriceTrigger(currentPrice, isTriggered?1:0, new Date()));
          todaysEnergyPrices.forEach(hourlyprice => {
            const dateString = hourlyprice.startsAt;
            const cents = hourlyprice.total;
            const dateLong = Date.parse(dateString);
            const date = new Date(dateLong);
            const hours = date.getHours();
            const min = date.getMinutes();
            const index = hours * 4 + Math.round(min/15);
            this.dailyMap.set(index, new PriceTrigger(cents, isTriggered && index === currentIndex ?1:0, date));

          });
          return resolve(isTriggered);
        }).catch(err => {
          this.logger.debug('Could not fetch todays prices,error : ', err);
          return resolve(false);
        });
      }).catch(error => {
        this.logger.debug('Tibber: Could not determine trigger ', error);
        return resolve(false);
      });
    });
  }

  // check if we have the lowest energy price for today - if yes, raise the trigger
  _getTrigger(todaysLowestPrice: number, currentPrice: number, socBattery: number, socLowerThreshold: number ): boolean {
    const diffToLowest = currentPrice - todaysLowestPrice;
    // diffToLowest is in acceptable range
    this.logger.debug('lowest today: ' + todaysLowestPrice + ' current: ' + currentPrice + ' diffToLowest: ' + diffToLowest );
    if (diffToLowest <= this.thresholdCnts && socBattery >= socLowerThreshold ) {
      this.logger.debug('trigger lowest price: true');
      return true;
    }
    this.logger.debug('trigger lowest price: false');
    return false;
  }


}
