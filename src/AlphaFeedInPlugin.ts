
import { HAP, API, PlatformConfig, Logging } from 'homebridge';
import { AlphaService } from './index';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';
import { BasePlugin } from './BasePlugin';

export class AlphaFeedInplugin extends BasePlugin {

  // Alpha ESS Battery Light Feed in / Feed Out Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService) {
    super(log, config, api, alphaService, 'AlphaEssFeedInPlugin' );
  }

  initServiceCharacteristics(hap: HAP) {
    this.setService(new hap.Service.LightSensor(this.getName()));
    this.getCharacteristics().onGet(this.handleGet.bind(this));
    this.getCharacteristics().setProps({minValue:-50000, maxValue:50000});
  }

  onResponse(detailData: AlphaLastPowerDataResponse) {
    const loadFromResponse = detailData.data.pgrid;
    const load = (loadFromResponse !== undefined && loadFromResponse !== null ) ? loadFromResponse : 0;
    this.setValue(load);
    if (load !== undefined && load !== null && this.getService() !== null) {
      this.getCharacteristics().updateValue(load);
    }
  }

}
