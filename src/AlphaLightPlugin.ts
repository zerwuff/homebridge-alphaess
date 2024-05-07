
import { HAP, API, PlatformConfig, Logging } from 'homebridge';
import { AlphaService } from './index';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';
import { BasePlugin } from './BasePlugin';

export class AlphaLightPlugin extends BasePlugin{

  // Alpha ESS Battery Light Total Power Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService) {
    super(log, config, api, alphaService, 'AlphaEssTotalPowerPlugin' );
  }

  // create light sensor for current total power
  initServiceCharacteristics(hap: HAP) {
    this.setService(new hap.Service.LightSensor(this.getName()));
    this.getCharacteristics().onGet(this.handleGet.bind(this));
    this.getCharacteristics().setProps({minValue:0});
  }

  onResponse(detailData: AlphaLastPowerDataResponse) {
    const totalPower = this.getAlphaService().getTotalPower(detailData);
    this.setValue( (totalPower !== undefined && totalPower !== null) ? totalPower : 0);
    if (this.getValue() !== undefined && this.getValue() !== null) {
      this.getCharacteristics().updateValue(this.getValue());
    }
  }
}
