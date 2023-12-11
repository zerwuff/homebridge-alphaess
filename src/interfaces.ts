
export class AlphaTrigger {
  trigger: number;
  date:Date;
  tibberTriggerLoading: boolean;

  constructor(trigger:number, tibberTriggerLoading: boolean, date:Date){
    this.trigger = trigger;
    this.date = date;
    this.tibberTriggerLoading = tibberTriggerLoading;
  }
}


export class PriceTrigger {
  price: number;
  trigger: number;
  date: Date;
  loadingTrigger: boolean;

  constructor(price:number, trigger:number, date:Date){
    this.price = price;
    this.trigger = trigger;
    this.date = date;
  }
}


export class AlphaData {
  soc: number;
  ppv: number;
  timeStamp: string;

  constructor(soc:number, ppv:number, timeStamp: string){
    this.ppv = ppv;
    this.soc = soc;
    this.timeStamp = timeStamp;
  }
}