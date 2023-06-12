import 'jest';

import { TibberService } from '../../src/tibber/TibberService';
import { PROJECTION_PROPERTIES } from 'vega-lite/build/src/projection';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';

test('test trigger from tibber api - positive case (1)', async () => {

  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 3;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});

test('test trigger from tibber api - positive case (2)', async () => {
  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 5;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});


test('test trigger from tibber api - positive case (3)', async () => {
  const todaysLowestPrice = -2 ;
  const currentPrice = 7 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 10;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();

});


test('test trigger from tibber api - positive case (4)', async () => {
  const todaysLowestPrice = -2 ;
  const currentPrice = -3 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 1;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});



test('test trigger from tibber api - negative case (1)', async () => {
  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const socBattery = 49;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 3;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();

});


test('test trigger from tibber api - negative case (2)', async () => {

  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 4;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});


test('test trigger from tibber api - negative case (3)', async () => {

  const todaysLowestPrice = 0 ;
  const currentPrice = 5 ;
  const socBattery = 49;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 2;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut._getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});


test('find lowest todays price - positive case (1)', async() => {
  const sut = new TibberService('', '', 300);
  const prices = [new PriceTestData(50.0), new PriceTestData(20.0), new PriceTestData(70.0) ];
  expect( sut.findLowestPrice(prices) ).toBe(20.0);
});

test('find lowest todays price - positive case (1)', async() => {
  const sut = new TibberService('', '', 300);
  const prices = [new PriceTestData(-10.0), new PriceTestData(20.0), new PriceTestData(70.0) ];
  expect( sut.findLowestPrice(prices) ).toBe(-10.0);

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

