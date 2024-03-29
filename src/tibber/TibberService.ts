import { TibberQuery, IConfig } from 'tibber-api';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { PriceTrigger } from '../interfaces';
import { Logging } from 'homebridge';

export class TibberService {
  private config: IConfig;
  private dailyMap: Map<number, PriceTrigger>;
  private tibberHomeId: string ;
  private logger: Logging;
  private pricePoint : number;
  private lowestPriceHours: number ;
  private tibberLoadBatteryEnabled: boolean;
  private thresholdEur: number ;
  private triggerdToday: boolean;

  constructor(logger:Logging, tibberApiKey:string, tibberQueryUrl:string, thresholdEur: number,
    tibberLoadBatteryEnabled:boolean, tibberHomeId?: string){
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
    this.thresholdEur = thresholdEur;
    this.dailyMap = new Map();
    this.tibberHomeId= tibberHomeId;
    this.logger = logger;
    this.pricePoint = 0;
    this.lowestPriceHours = undefined;
    this.tibberLoadBatteryEnabled = tibberLoadBatteryEnabled;
    this.triggerdToday = undefined;
  }

  getLogger() : Logging{
    return this.logger;
  }

  setLogger(logger:Logging){
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
        this.getLogger().debug('could not collect home ids ', error);
        return reject();
      }).catch(err => {
        this.getLogger().debug('could not collect todays energy prices ', err);
      });
    });

  }

  // get threshold that will trigger tibber
  getPricePoint(): number {
    return this.pricePoint;
  }

  // determine lowest next price for the curent day
  findLowestPrice(prices: IPrice[]): IPrice {
    let lowest = undefined;
    let lowestIPrice = undefined;
    if (prices===undefined){
      return undefined;
    }
    prices.forEach(price => {
      price.total;
      if (lowest===undefined){
        lowest = price.total;
        lowestIPrice = price;
      }else{
        if (price.total < lowest){
          lowest = price.total;
          lowestIPrice = price;
        }
      }
    });
    return lowestIPrice;
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
            this.getLogger().
              debug('Tibber: Could not fetch prices: statusMessage:' + error.statusMessage + ' errorCode:' +error.statusCode);
            return reject();
          },
          );
      }).catch(err => {
        this.getLogger().
          error('could not fetch home ids ' + err);
      });
    });
  }


  async isTriggered(
    socCurrent: number /** Current SOC of battery */,
    socLowerThreshold: number /** SOC of battery to be trigger */): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.setIsTriggeredToday(false);
      this.findCurrentPrice().then( currentPrice => {
        this.getTodaysEnergyPrices().then(todaysEnergyPrices => {
          if (todaysEnergyPrices===undefined){
            this.getLogger().debug('Could not fetch todays prices, response is empty');
            return reject(false);
          }
          const todaysLowestIPrice = this.findLowestPrice(todaysEnergyPrices);
          const todaysLowestTime = todaysLowestIPrice.startsAt;
          const dateObject = new Date(todaysLowestTime);
          this.lowestPriceHours = dateObject.getHours(); // at which hour starts minimum Price ?
          const todaysLowestPrice = todaysLowestIPrice.total;
          const isTriggered= this._getTrigger(todaysLowestPrice, currentPrice, socCurrent, socLowerThreshold);
          const now = new Date();
          const hours = now.getHours();
          const min = now.getMinutes();
          const index = hours * 4 + Math.round(min/15);
          const currentIndex = hours * 4 + Math.round(min/15);
          this.pricePoint = todaysLowestPrice + this.thresholdEur;

          this.getDailyMap().set(index, new PriceTrigger(currentPrice, isTriggered?1:0, new Date()));
          todaysEnergyPrices.forEach(hourlyprice => {
            const dateString = hourlyprice.startsAt;
            const cents = hourlyprice.total;
            const dateLong = Date.parse(dateString);
            const date = new Date(dateLong);
            const hours = date.getHours();
            const min = date.getMinutes();
            const index = hours * 4 + Math.round(min/15);
            if (isTriggered){
              this.setIsTriggeredToday(true);
            }
            this.getDailyMap().set(index, new PriceTrigger(cents, isTriggered && index === currentIndex ?1:0, date));
          });
          return resolve(isTriggered);
        }).catch(err => {
          this.getLogger().debug('Could not fetch todays prices, error : ', err);
          return reject(false);
        });
      }).catch(error => {
        this.getLogger().debug('Tibber: Could not determine trigger ', error);
        return reject(false);
      });
    });
  }

  getLowestPriceHours():number{
    return this.lowestPriceHours;
  }


  getTibberLoadingBatteryEnabled():boolean{
    return this.tibberLoadBatteryEnabled;
  }

  getThresholdEur(){
    return this.thresholdEur;
  }

  getIsTriggeredToday(){
    return this. triggerdToday;
  }

  setIsTriggeredToday(trigger:boolean){
    this.triggerdToday = trigger;
  }

  // check if we have the lowest energy price for today - if yes, raise the trigger
  _getTrigger(todaysLowestPrice: number, currentPrice: number, socBattery: number, socLowerThreshold: number ): boolean {
    if (socBattery<0){
      this.getLogger().debug('battery not checked correctly ');
      return false;
    }
    const diffToLowest = currentPrice - todaysLowestPrice;
    // diffToLowest is in acceptable range
    this.getLogger().debug('lowest today: ' + todaysLowestPrice + ' current: ' + currentPrice + ' diffToLowest: ' + diffToLowest );
    if (diffToLowest <= this.getThresholdEur() && (socBattery <= socLowerThreshold )) {
      this.getLogger().debug('trigger lowest price: true');
      return true;
    }
    this.getLogger().debug('trigger lowest price: false');
    return false;
  }




}
