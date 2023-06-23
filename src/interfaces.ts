
export class AlphaTrigger {
  trigger: number;
  date:Date;

  constructor(trigger:number, date:Date){
    this.trigger = trigger;
    this.date = date;
  }
}


export class PriceTrigger {
  price: number;
  trigger: number;
  date: Date;

  constructor(price:number, trigger:number, date:Date){
    this.price = price;
    this.trigger = trigger;
    this.date = date;
  }
}
