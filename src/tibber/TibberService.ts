import { TibberQuery, IConfig } from 'tibber-api';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { AlphaImageService } from '../alpha/AlphaImageService';

export class PriceTrigger {
  price: number;
  trigger: boolean;
  constructor(price:number, trigger:boolean){
    this.price = price;
    this.trigger = trigger;
  }
}


export class TibberService {
  private IMAGE_INDEX_LENGHT = 96;
  private config: IConfig;
  private thresholdCnts: number; // threshold to lowest in cents
  private dailyMap: Map<number, PriceTrigger>;
  private alphaImageService: AlphaImageService;
  private imageUrl ='tibber_image.png';
  private tibberHomeId: string ;
  private tibberImageFilename;
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
    this.dailyMap = new Map();
    this.tibberHomeId= tibberHomeId;
    this.alphaImageService = new AlphaImageService(this.imageUrl);
  }

  getDailyMap(): Map<number, PriceTrigger>{
    return this.dailyMap;
  }

  async getTodaysEnergyPrices(): Promise<IPrice[]> {
    const tibberQuery = new TibberQuery(this.config);

    return new Promise((resolve, reject) => {
      tibberQuery.getHomes().then( homes => {
        const homeId = this.tibberHomeId !== undefined ? this.tibberHomeId : homes[0].id;
        return Promise.resolve(tibberQuery.getTodaysEnergyPrices(homeId));
      }).catch( () => {
        return Promise.reject();
      },
      );
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
          return Promise.resolve(current.total);
        } ).
          catch(error => {
            console.error('Tibber: Could not fetch prices: statusMessage:' + error.statusMessage + ' errorCode:' +error.statusCode);
            return Promise.reject();
          },
          );
      });
    });
  }

  // check if we have the lowest energy price for today - if yes, raise the trigger
  _getTrigger(todaysLowestPrice: number, currentPrice: number, socBattery: number, socLowerThreshold: number ): boolean {
    const diffToLowest = currentPrice - todaysLowestPrice;
    // diffToLowest is in acceptable range
    console.log('lowest today: ' + todaysLowestPrice + ' current: ' + currentPrice + ' diffToLowest: ' + diffToLowest );
    if (diffToLowest <= this.thresholdCnts && socBattery >= socLowerThreshold ) {
      console.log('trigger lowest price: true');
      return true;
    }
    console.log('trigger lowest price: false');
    return false;
  }

  async isTriggered(socCurrent: number /** Current SOC of battery */,
    socLowerThreshold: number /** SOC of battery to be trigger */ ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.findCurrentPrice().then( currentPrice => {
        this.getTodaysEnergyPrices().then(lowestPrice=> {
          const todaysLowestPrice = this.findLowestPrice(lowestPrice );
          const isTriggered= this._getTrigger(todaysLowestPrice, currentPrice, socCurrent, socLowerThreshold);
          const hours = new Date().getHours();
          const min = new Date().getMinutes();
          const index = hours * 4 + Math.round(min/15);
          this.dailyMap[index] = new PriceTrigger(currentPrice, isTriggered);
          return Promise.resolve(isTriggered);
        }).catch(err => {
          console.log('could not fetch todays prices,error : ' + err);
          return Promise.resolve(false);
        });
      }).catch( error => {
        console.error('Tibber: Could not determine trigger ');
        return Promise.resolve(false);
      });
    });
  }

  // render current Image from current values
  async renderImage(): Promise<boolean>{
    console.log('render image triggered with:' + this.dailyMap + ' data points');

    let index = 0;
    const values = new Array(0);
    while (index < this.IMAGE_INDEX_LENGHT ) { // 15 min intervall
      if (this.dailyMap.has(index)){
        const cnt = this.dailyMap[index].currentPrice;
        const trigger = this.dailyMap[index].trigger; //TODO;index > 40 && index < 65;
        const entry = {time:index, cnt: cnt, trigger:trigger};
        values.push(entry);
      } else{
        const entry = {time:index, cnt: 0, trigger: false};
        values.push(entry);
      }
      index++ ;
    }
    await this.alphaImageService.graphToImageTibber(this.imageUrl, values);
    return true;
  }
}
