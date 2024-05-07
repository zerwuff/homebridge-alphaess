
import { HAP, API, AccessoryPlugin, PlatformConfig, Service, Logging, Characteristic } from 'homebridge';
import { AlphaService } from './index';
import { AlphaServiceEventListener } from './interfaces';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';
import { MANUFACTURER } from './settings';

export abstract class BasePlugin implements AccessoryPlugin, AlphaServiceEventListener<AlphaLastPowerDataResponse> {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private value: number;

  private hap: HAP ;
  private log: Logging;
  private name: string; // this attribute is required for registreing the accessoryplugin

  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService, name:string) {
    this.hap = api.hap;
    this.log = log;
    this.name= name;
    log.debug('Alpha ESS Accessory Loaded: ' + this.getName());
    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, this.getName());
    this.alphaService = alphaService;
    this.alphaService.addListener(this);

    this.initServiceCharacteristics(this.hap);
  }

  getService() {
    return this.service;
  }

  setService(service:Service){
    this.service = service;
  }

  abstract initServiceCharacteristics(hap:HAP);

  abstract onResponse(detailData: AlphaLastPowerDataResponse);

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  getCharacteristics(): Characteristic {
    return this.getService().getCharacteristic(this.getHAP().Characteristic.CurrentAmbientLightLevel);
  }

  getHAP():HAP{
    return this.hap;
  }

  getLOG():Logging {
    return this.log;
  }

  getName(){
    return this.name;
  }

  getAlphaService(){
    return this.alphaService;
  }

  identify(): void {
    this.log.debug('Its me:'+this.getName());
  }

  setValue(value: number){
    this.value = value;
  }

  getValue(){
    return this.value;
  }

  handleGet(){
    return this.value;
  }

}