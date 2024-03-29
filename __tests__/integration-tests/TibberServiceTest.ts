import 'jest';

import { TibberService } from '../../src/tibber/TibberService';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';
import { ImageRenderingService } from '../../src/alpha/ImageRenderingService';
import { mock } from 'jest-mock-extended';
import { Logging } from 'homebridge/lib/logger';
import { AlphaTrigger } from '../../src/index';
import { PriceTrigger } from '../../src/interfaces';

const logger = mock<Logging>();

test('test trigger from tibber api - positive case (1)', async () => {

  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 1;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);

  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});

test('test trigger from tibber api - positive case (2)', async () => {
  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 5;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);

  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});


test('test trigger from tibber api - positive case (3)', async () => {
  const todaysLowestPrice = -2 ;
  const currentPrice = 7 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 9;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});


test('test trigger from tibber api - positive case (4)', async () => {
  const todaysLowestPrice = -2 ;
  const currentPrice = -3 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 1;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});



test('test trigger from tibber api - negative case (1)', async () => {
  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const currentSOCBattery = 51;
  const socBatteryLowerThreshold = 50;

  const maxPriceThreshold = 3;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, currentSOCBattery, socBatteryLowerThreshold)).toBeFalsy();

});


test('test trigger from tibber api - negative case (2)', async () => {

  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 4;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});


test('test trigger from tibber api - negative case (3)', async () => {

  const todaysLowestPrice = 0 ;
  const currentPrice = 5 ;
  const socBattery = 49;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 2;
  const sut = new TibberService(logger, '', '', maxPriceThreshold, false);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});


test('find lowest todays price - positive case (1)', async() => {
  const sut = new TibberService(logger, '', '', 300, false);
  const prices = [new PriceTestData(50.0), new PriceTestData(20.0), new PriceTestData(70.0) ];
  expect( sut.findLowestPrice(prices).total).toBe(20.0);
});

test('find lowest todays price - positive case (1)', async() => {
  const sut = new TibberService(logger, '', '', 300, false);
  const prices = [new PriceTestData(-10.0), new PriceTestData(20.0), new PriceTestData(70.0) ];
  expect( sut.findLowestPrice(prices).total ).toBe(-10.0);
});


class PriceTestData implements IPrice {
  homeId?: string;
  total: number;
  energy: number;
  tax: number;
  startsAt: string;
  level: PriceLevel;
  constructor(total:number){
    this.total = total;
  }
}


test('test image rendering from tibber test data json', async () => {
  const imageService = new ImageRenderingService();
  const alphaMap = new Map<number, AlphaTrigger>() ;
  const tibberMap = new Map<number, PriceTrigger>() ;

  let cnt = 0;


  while (cnt < 96 ) { // 15 min intervall
    cnt++ ;
    const price = cnt *0.01;
    const triggerTibber = cnt > 30 && cnt < 55 ? 1:0;
    const triggerAlpha = cnt > 10 && cnt < 35 ? 1:0;
    const fullminutes = cnt * 15 ;
    const fullhours = Math.floor( cnt / 4);
    const remainder = fullminutes - (fullhours * 4) * 15 ;
    const date = new Date() ;
    date.setSeconds(0);
    date.setHours(fullhours);
    date.setMinutes(remainder);

    //const entry = {time: date.toISOString(), cnt: cnt, triggerTibber:triggerTibber, triggerAlpha:triggerAlpha};
    //values.push(entry);

    const tibberEntry = new PriceTrigger(price, triggerTibber, date);
    tibberMap.set(cnt, tibberEntry);

    const alphaEntry = new AlphaTrigger(triggerAlpha, false, date);
    alphaMap.set(cnt, alphaEntry);


    console.debug(date);

  }
  const imageUrl = await imageService.renderTriggerImage('image_rendered_tibber.png', tibberMap, alphaMap, 0.5 );

  expect(imageUrl).toBeDefined();
});

