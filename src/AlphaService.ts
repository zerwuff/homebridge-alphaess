
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AlphaEssApi } from "alphaess-api-js"

"use strict";

export class AlphaService implements AccessoryPlugin {

    private informationService: Service;
    private service: Service;
    private api: API; 
    private log: Logger; 

    constructor(log, config: AccessoryConfig, api: API ) {
      this.api = api;
      this.log = log;
      log.debug('Alpha ESS Accessory Loaded');
         
      // your accessory must have an AccessoryInformation service
      this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Alpha Ess Plugin by Jens Zeidler")
      .setCharacteristic(this.api.hap.Characteristic.Model, "Alpha Ess ");
      
      
      //this.service = new this.api.hap.Service.Switch(config.name);

      this.service = new this.api.hap.Service.BatteryService(config.name, "hvBatteryLevel")

      this.service.getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
        .onGet(this.handleStatusLowBatteryGet.bind(this));


      this.service.getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
      .onGet(this.handleStatusBattery.bind(this));
    
      this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.getOnStatus.bind(this))
      .onSet(this.setOnStatus.bind(this));

    } 
  
    /**
     * REQUIRED - This must return an array of the services you want to expose.
     * This method must be named "getServices".
     */
  


    getServices() {
        return [
          this.informationService,
          this.service
        ];
      }


      getOnStatus(someObject:object) {
        this.log.debug('Triggered GET ON Status');
        return 1;
      }

      /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
     */
      identify(): void {
        this.log.debug('Identify');
    }

      setOnStatus(value) {
        this.log.debug('Triggered SET ON Status');
        return;
      }
      handleStatusLowBatteryGet() {
        this.log.debug('Triggered GET StatusLowBattery');
  
        // set this to a valid value for StatusLowBattery
        const currentValue = this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  
        return currentValue;
    }
      handleStatusBattery() {
        this.log.debug('Triggered GET Battery Level');
  
        // set this to a valid value for StatusLowBattery
        return 42;
      }  
}
