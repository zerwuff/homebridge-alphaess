import 'jest';

import { TibberService } from '../../src/tibber/TibberService';


test('test trigger from tibber api - positive case (1)', async () => {

  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 3;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});

test('test trigger from tibber api - positive case (2)', async () => {


  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 5;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});


test('test trigger from tibber api - positive case (3)', async () => {

  const todaysLowestPrice = -2 ;
  const currentPrice = 7 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 10;
  const sut = new TibberService('', '', maxPriceThreshold);

  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();

});


test('test trigger from tibber api - positive case (4)', async () => {


  const todaysLowestPrice = -2 ;
  const currentPrice = -3 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 1;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeTruthy();
});



test('test trigger from tibber api - negative case (1)', async () => {
  const todaysLowestPrice = 30 ;
  const currentPrice = 31 ;
  const socBattery = 49;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 3;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();

});


test('test trigger from tibber api - negative case (2)', async () => {

  const todaysLowestPrice = 20 ;
  const currentPrice = 25 ;
  const socBattery = 50;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 4;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});


test('test trigger from tibber api - negative case (3)', async () => {

  const todaysLowestPrice = 0 ;
  const currentPrice = 5 ;
  const socBattery = 49;
  const socBatteryThreshold =50;

  const maxPriceThreshold = 2;
  const sut = new TibberService('', '', maxPriceThreshold);
  expect(sut.getTrigger(todaysLowestPrice, currentPrice, socBattery, socBatteryThreshold)).toBeFalsy();
});