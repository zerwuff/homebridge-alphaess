
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AlphaEssApi } from "alphaess-api-js"

"use strict";

export class AlphaService {

    private informationService: Service;
    private batteryService: Service;
    private api: API; 
    private log: Logger; 

    constructor(log, config, api) {
      this.api = api;
      this.log = log;
      log.debug('Alpha ESS Accessory Loaded');
         
      // your accessory must have an AccessoryInformation service
      this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Alpha Ess Plugin by Jens Zeidler")
      .setCharacteristic(this.api.hap.Characteristic.Model, "Alpha Ess ");
      
      
      this.batteryService = new this.api.hap.Service.Battery();

      this.batteryService.getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
        .onGet(this.handleStatusLowBatteryGet.bind(this));


      this.batteryService.getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
      .onGet(this.handleStatusBattery.bind(this));

    
    } 
  
    /**
     * REQUIRED - This must return an array of the services you want to expose.
     * This method must be named "getServices".
     */
  

    getServices() {
        return [
          this.informationService,
          this.batteryService
        ];
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
