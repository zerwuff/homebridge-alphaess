import 'jest';

import { AlphaService, EnergyTriggerPlugin, TibberService } from '../../src/index';

import { HAP, Logging, Service} from 'homebridge';
import { PlatformConfig} from 'homebridge';
import { API } from 'homebridge';
import { Mock, It, Times } from 'moq.ts';
import { PriceTrigger } from '../../src/interfaces';
import { IPrice } from 'tibber-api/lib/src/models/IPrice';
import { AlphaData, AlphaDetailResponse } from '../../src/alpha/response/AlphaDetailResponse';
import { logger } from 'vega';
import { any } from 'jest-mock-extended';


const loging = new Mock<Logging>()
  .setup( instance => instance.debug).returns(m => m).
  setup(instance => instance.error).returns(m => m);

const pfc = new Mock<PlatformConfig>().setup(
  instance => instance.debug,
).returns(m => m);


const api = new Mock<API>().setup(instance => instance.version).returns(1);

test('test trigger from tibber api - positive case (1)', async () => {
  const ipriceLow = new Mock<IPrice>().setup(inst => inst.total).returns(11).setup(inst => inst.startsAt).returns('10:00').object();
  const ipriceHigh = new Mock<IPrice>().setup(inst => inst.total).returns(20).setup(inst => inst.startsAt).returns('12:00').object();
  const list = [ipriceLow, ipriceHigh];

  const tibberPrices = new Promise<IPrice[]>((resolve) => {
    resolve(list);
  });

  const alphaDetailResp = new Promise<AlphaDetailResponse>((resolve) => {
    const detail = new AlphaDetailResponse();
    detail.code = 200;
    detail.data = new AlphaData();
    resolve(detail);
  });

  const alphaService = new Mock<AlphaService>()
    .setup( instance => instance.getDetailData). returns(() => alphaDetailResp );

  const tibberServiceOrigin = new TibberService(loging.object(), '', '', 20, false, undefined);
  tibberServiceOrigin.setLogger(loging.object());

  const tibberService = new Mock<TibberService>()
    .setup(instance => instance.getDailyMap).returns(() => new Map<number, PriceTrigger>)

    .setup(instance => instance.isTriggered).mimics(tibberServiceOrigin)
    .setup(instance => instance.getLowestPriceHours).returns( () => 10)
    .setup(instance => instance.findLowestPrice).returns(() => ipriceLow )
    .setup(instance => instance.findCurrentPrice).returns( () => new Promise<number>((resolve => {
      resolve(10);
    })))
    .setup(async instance => instance.getTodaysEnergyPrices).returnsAsync(() => tibberPrices)
    .setup(instance => instance.getTodaysEnergyPrices).returns(() => tibberPrices);

  tibberService.object().setLogger(loging.object());

  const sut = new EnergyTriggerPlugin(loging.object(), pfc.object(), api.object());

  sut.setAlphaService(alphaService.object());
  sut.calculateTibberTrigger(tibberService.object());

  tibberService.verify(instance => instance.isTriggered, Times.Exactly(1));
  tibberService.verify(instance => instance.getLowestPriceHours, Times.Never());
  tibberService.verify(instance => instance.getTodaysEnergyPrices, Times.Never());

});
