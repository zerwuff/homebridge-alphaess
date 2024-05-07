
import { HAP, API, PlatformConfig, Logging } from 'homebridge';
import { AlphaService } from './index';
import { BasePlugin } from './BasePlugin';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';

export class AlphaLoadPlugin extends BasePlugin {

  // Alpha ESS Battery Light Total Power Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService) {
    super(log, config, api, alphaService, 'AlphaEssLoadPlugin' );
  }

  initServiceCharacteristics(hap: HAP) {
    this.setService(new hap.Service.LightSensor(this.getName()));
    this.getCharacteristics().onGet(this.handleGet.bind(this));
    this.getCharacteristics().setProps({minValue:0});
  }

  onResponse(detailData: AlphaLastPowerDataResponse) {
    const loadFromResponse = detailData.data.pload;
    const load = (loadFromResponse !== undefined && loadFromResponse !== null) ? loadFromResponse : 0;
    this.setValue(load);
    if (load !== undefined && load !== null) {
      this.getCharacteristics().updateValue(this.getValue());
    }
  }


}
