
import { HAP, API, AccessoryPlugin, PlatformConfig, Service, Logging, Topics } from 'homebridge';
import { AlphaService } from './index';
import { AlphaServiceEventListener } from './interfaces';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';
import { MANUFACTURER } from './settings';

export class AlphaFeedInplugin implements AccessoryPlugin, AlphaServiceEventListener<AlphaLastPowerDataResponse> {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;

  private hap: HAP ;
  private log: Logging;
  private name: string; // this attribute is required for registring the accessoryplugin
  private load: number;

  // Alpha ESS Feed In Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService) {
    this.hap = api.hap;
    this.log = log;
    this.load = 0;
    this.name= 'AlphaEssFeedInPlugin';
    log.debug('Alpha ESS Accessory Loaded: ' + this.getName());

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, this.getName());

    // create light sensor for feed In
    this.service = new this.hap.Service.LightSensor(this.name);
    this.service.getCharacteristic(this.hap.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.handleCurrentLightLevelGet.bind(this));
    this.service.getCharacteristic(this.hap.Characteristic.CurrentAmbientLightLevel).setProps({minValue:-50000, maxValue:50000});

    this.alphaService = alphaService;
    this.alphaService.addListener(this);
  }

  getName(){
    return this.name;
  }

  onResponse(detailData: AlphaLastPowerDataResponse) {
    const load = detailData.data.pgrid;
    this.load = (load !== undefined && load !== null ) ? load : 0;
    if (this.load !== undefined && this.load !== null) {
      this.service.getCharacteristic(this.hap.Characteristic.CurrentAmbientLightLevel).updateValue(this.load);
    }
  }

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  identify(): void {
    this.log.debug('Its me:'+this.getName());
  }

  handleCurrentLightLevelGet(){
    return this.load;
  }

}
