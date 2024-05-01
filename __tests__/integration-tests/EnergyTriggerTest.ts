import 'jest';

import { AlphaService, EnergyTriggerPlugin, TibberService } from '../../src/index';
import { Logging } from 'homebridge';
import { PlatformConfig} from 'homebridge';
import { Mock, Times, It } from 'moq.ts';
import { API } from 'homebridge';
import { PriceTrigger } from '../../src/interfaces';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { PriceLevel } from 'tibber-api/lib/src/models/enums/PriceLevel';
import { AlphaDataResponse, AlphaLastPowerDataResponse } from '../../src/alpha/response/AlphaLastPowerDataResponse';


const loging = new Mock<Logging>()
  .setup( instance => instance.debug).returns(m => m).
  setup(instance => instance.error).returns(m => m);


const api = new Mock<API>().setup(instance => instance.version).returns(1);

class PFConfig implements PlatformConfig{
  platform: string;
  tibberEnabled = true;
  tibberThresholdSOC = 49;
  tibberThresholdEur = 0.5;
  //triggerImageFilename = '';
  tibberLoadBatteryEnabled = true;
}

class PriceTestData implements IPrice {
  homeId?: string;
  total: number;
  energy: number;
  tax: number;
  startsAt: string;
  level: PriceLevel;
  constructor(total:number, startsAt: string){
    this.total = total;
    this.startsAt = startsAt;
  }
}


const alphaDetailResp = new Promise<AlphaLastPowerDataResponse>((resolve) => {
  const detail = new AlphaLastPowerDataResponse();
  detail.code = 200;
  detail.data = new AlphaDataResponse();
  resolve(detail);
});


test('test trigger tibber service via energy plugin - expect triggered ', async () => {
  const listIprice:IPrice[] = [new PriceTestData(10, '10:00'), new PriceTestData(20, '12:00')];
  const alphaLastPowerDataResp = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.soc = 50;
  alphaLastPowerDataResp.data = data;

  const alphaService = new Mock<AlphaService>()
    .setup( instance => instance.addListener).returns( () => undefined)
    .setup( instance => instance.getLastPowerData). returns(() => alphaDetailResp )
    .setup( instance => instance.isBatteryCurrentlyLoading). returns(() => true );

  const tibberServiceOrigin = new TibberService(loging.object(), 'apiKey', 'queryUrl', 0.2, false);
  tibberServiceOrigin.setLogger(loging.object());

  const tibberServiceMock = new Mock<TibberService>()
    .setup(instance => instance.getThresholdEur).returns( () => 0.5)
    .setup(instance => instance.isTriggered).mimics(tibberServiceOrigin)
    .setup(instance => instance._getTrigger).mimics(tibberServiceOrigin)
    .setup(instance => instance.findLowestPrice).mimics(tibberServiceOrigin)
    .setup(instance => instance.getDailyMap).returns(() => new Map<number, PriceTrigger>)
    .setup(instance => instance.getLowestPriceHours).returns( () => 10)
    .setup(instance => instance.findCurrentPrice).returns( () => new Promise<number>((resolve => {
      resolve(10);
    })))
    .setup(instance => instance.getTodaysEnergyPrices).returns(() =>new Promise<IPrice[]>((resolve => {
      resolve(listIprice);
    })))
    .setup(instance => instance.getLogger).returns(() => loging.object());


  tibberServiceMock.object().setLogger(loging.object());

  const sut = new EnergyTriggerPlugin(loging.object(), new PFConfig(), api.object(), alphaService.object());

  sut.setSocCurrent(10);

  // when
  const result = await sut.calculateTibberTrigger(tibberServiceMock.object());


  // then
  tibberServiceMock.verify(instance => instance.isTriggered, Times.Exactly(1));
  tibberServiceMock.verify(instance => instance.findCurrentPrice, Times.Once());
  tibberServiceMock.verify(instance => instance.getTodaysEnergyPrices, Times.Once());

  expect(result).toBeTruthy();

  sut.calculateCombinedTriggers( new PFConfig(), alphaLastPowerDataResp);
  expect(sut.getTriggerTotal()).toBeTruthy();

});


test('test trigger tibber service via energy plugin -  expect stop battery loading ', async () => {
  const listIprice:IPrice[] = [new PriceTestData(10, '10:00'), new PriceTestData(20, '12:00')];
  const alphaLastPowerDataResp = new AlphaLastPowerDataResponse();

  const alphaService = new Mock<AlphaService>()
    .setup( instance => instance.addListener).returns( () => undefined)
    .setup( instance => instance.getLastPowerData). returns(() => alphaDetailResp )
    .setup( instance => instance.checkAndEnableReloading). returns(() => new Promise<Map<string, undefined>>((resolve => undefined)))
    .setup( instance => instance.isBatteryCurrentlyLoading). returns(() => false)
    .setup( instance => instance.stopLoading). returns(() => new Promise<void>( resolve => undefined));
  const tibberServiceOrigin = new TibberService(loging.object(), 'apiKey', 'queryUrl', 0.2, false);
  tibberServiceOrigin.setLogger(loging.object());

  const tibberServiceMock = new Mock<TibberService>()
    .setup(instance => instance.getThresholdEur).returns( () => 0.5)
    .setup(instance => instance.isTriggered).mimics(tibberServiceOrigin)
    .setup(instance => instance._getTrigger).mimics(tibberServiceOrigin)
    .setup(instance => instance.findLowestPrice).mimics(tibberServiceOrigin)
    .setup(instance => instance.getIsTriggeredToday()).mimics(tibberServiceOrigin)
    .setup(instance => instance.getDailyMap).returns(() => new Map<number, PriceTrigger>)
    .setup(instance => instance.getLowestPriceHours).returns( () => 10)
    .setup(instance => instance.findCurrentPrice).returns( () => new Promise<number>((resolve => {
      resolve(10);
    })))
    .setup(instance => instance.getTodaysEnergyPrices).returns(() =>new Promise<IPrice[]>((resolve => {
      resolve(listIprice);
    })))
    .setup(instance => instance.getLogger).returns(() => loging.object());


  tibberServiceMock.object().setLogger(loging.object());

  const sut = new EnergyTriggerPlugin(loging.object(), new PFConfig(), api.object(), alphaService.object());
  sut.setTibberService(tibberServiceMock.object());
  sut.setSocCurrent(10);


  // when
  await sut.calculateAlphaTrigger('1234', alphaLastPowerDataResp);

  // then no stopping loading
  tibberServiceMock.verify(instance => instance.isTriggered, Times.Never());
  alphaService.verify(instance => instance.stopLoading, Times.Never());
  alphaService.verify(instance => instance.checkAndEnableReloading, Times.Never());

  sut.calculateCombinedTriggers( new PFConfig(), alphaLastPowerDataResp);
  expect(sut.getTriggerTotal()).toBeFalsy();

});


test('test trigger tibber service via energy plugin - expect not triggered', async () => {
  const currentPrice = 27.0;
  const alphaLastPowerDataResp = new AlphaLastPowerDataResponse();
  const listIprice:IPrice[] = [new PriceTestData(34.0, '10:00'),
    new PriceTestData(currentPrice, '14:00'),
    new PriceTestData(25.0, '12:00')];

  const alphaService = new Mock<AlphaService>()
    .setup( instance => instance.addListener).returns( () => undefined)
    .setup( instance => instance.getLastPowerData). returns(() => alphaDetailResp )
    .setup (instance => instance.isBatteryCurrentlyLoading).returns( () => true ) ;

  const tibberServiceOrigin = new TibberService(loging.object(), 'apiKey', 'queryUrl', 0.5, false);
  tibberServiceOrigin.setLogger(loging.object());

  const tibberServiceMock = new Mock<TibberService>()
    .setup(instance => instance.getThresholdEur).returns( () => 0.5)
    .setup(instance => instance.isTriggered).mimics(tibberServiceOrigin)
    .setup(instance => instance._getTrigger).mimics(tibberServiceOrigin)
    .setup(instance => instance.findLowestPrice).mimics(tibberServiceOrigin)
    .setup(instance => instance.getIsTriggeredToday).mimics(tibberServiceOrigin)
    .setup(instance => instance.getDailyMap).returns(() => new Map<number, PriceTrigger>)
    .setup(instance => instance.getLowestPriceHours).returns( () => currentPrice)
    .setup(instance => instance.findCurrentPrice).returns( () => new Promise<number>((resolve => {
      resolve(currentPrice);
    })))
    .setup(instance => instance.getTodaysEnergyPrices).returns(() =>new Promise<IPrice[]>((resolve => {
      resolve(listIprice);
    })))
    .setup(instance => instance.getLogger).returns(() => loging.object());

  tibberServiceMock.object().setLogger(loging.object());

  const sut = new EnergyTriggerPlugin(loging.object(), new PFConfig(), api.object(), alphaService.object());
  sut.setTibberService(tibberServiceMock.object());
  sut.setSocCurrent(10);

  // when
  const result = await sut.calculateTibberTrigger(tibberServiceMock.object());

  // then
  tibberServiceMock.verify(instance => instance.isTriggered, Times.Exactly(1));
  tibberServiceMock.verify(instance => instance.findCurrentPrice, Times.Exactly(1));
  tibberServiceMock.verify(instance => instance.getTodaysEnergyPrices, Times.Exactly(1));
  expect(result).toBeFalsy();

  // when
  await sut.calculateAlphaTrigger('1234', alphaLastPowerDataResp);
  tibberServiceMock.setup(instance => instance.getIsTriggeredToday).mimics(tibberServiceOrigin);

  // then no stopping loading
  tibberServiceMock.verify(instance => instance.isTriggered, Times.Exactly(1));
  alphaService.verify(instance => instance.checkAndEnableReloading, Times.Never());
  alphaService.verify(instance => instance.stopLoading, Times.Never());

  sut.calculateCombinedTriggers( new PFConfig(), alphaLastPowerDataResp);
  expect(sut.getTriggerTotal()).toBeFalsy();
});



test('test trigger tibber service via energy plugin - expect triggered despite of exception ', async () => {
  const listIprice:IPrice[] = [new PriceTestData(10, '10:00'), new PriceTestData(20, '12:00')];
  const alphaLastPowerDataResp = new AlphaLastPowerDataResponse();
  const alphaDataResponse = new AlphaDataResponse();
  alphaDataResponse.soc = 10 ;
  alphaLastPowerDataResp.data = alphaDataResponse;

  const alphaService = new Mock<AlphaService>()
    .setup( instance => instance.getLastPowerData). returns(() => alphaDetailResp )
    .setup( instance => instance.addListener).returns( () => undefined)
    .setup( instance => instance.isBatteryCurrentlyLoadingCheckNet).returns( () => new Promise<boolean>((resolve => {
      resolve(true);
    }
    )))
    .setup( instance => instance.isBatteryCurrentlyLoading). returns(() => true )
    .setup( instance => instance.getSettingsData). throws(() => new Error('Could not load data') );

  const tibberServiceOrigin = new TibberService(loging.object(), 'apiKey', 'queryUrl', 0.2, false);
  tibberServiceOrigin.setLogger(loging.object());

  const tibberServiceMock = new Mock<TibberService>()
    .setup(instance => instance.getThresholdEur).returns( () => 0.5)
    .setup(instance => instance.isTriggered).mimics(tibberServiceOrigin)
    .setup(instance => instance._getTrigger).mimics(tibberServiceOrigin)
    .setup(instance => instance.findLowestPrice).mimics(tibberServiceOrigin)

    .setup(instance => instance.getDailyMap).returns(() => new Map<number, PriceTrigger>)
    .setup(instance => instance.getLowestPriceHours).returns( () => 10)
    .setup(instance => instance.findCurrentPrice).returns( () => new Promise<number>((resolve => {
      resolve(10);
    })))
    .setup(instance => instance.getTodaysEnergyPrices).returns(() =>new Promise<IPrice[]>((resolve => {
      resolve(listIprice);
    })))
    .setup(instance => instance.getLogger).returns(() => loging.object());


  tibberServiceMock.object().setLogger(loging.object());

  const sut = new EnergyTriggerPlugin(loging.object(), new PFConfig(), api.object(), alphaService.object());
  sut.setSocCurrent(10);

  // when
  const result = await sut.calculateTibberTrigger(tibberServiceMock.object());
  // then
  tibberServiceMock.verify(instance => instance.isTriggered, Times.Exactly(1));
  tibberServiceMock.verify(instance => instance.findCurrentPrice, Times.Once());
  tibberServiceMock.verify(instance => instance.getTodaysEnergyPrices, Times.Once());

  expect(result).toBeTruthy();

  sut.calculateCombinedTriggers( new PFConfig(), alphaLastPowerDataResp);
  expect(sut.getTriggerTotal()).toBeTruthy();

});