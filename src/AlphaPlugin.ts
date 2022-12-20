
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"
import { off, report } from 'process';
import { json } from 'stream/consumers';

// https://github.com/CharlesGillanders/alphaess/blob/main/alphaess/alphaess.py
export class AlphaPlugin implements AccessoryPlugin {

    private alphaService: AlphaService;
    private informationService: Service;
    private service: Service;
    private api: API; 
    private log: Logger; 

    
    private username : string;
    private password : string ; 
    private serialnumber: string ;
    private bearer: string ; 
  
    private batteryLevel : number ;

    constructor(log, config: AccessoryConfig, api: API ) {
      this.api = api;
      this.log = log;
      this.batteryLevel = 0;
      log.debug('Alpha ESS Accessory Loaded');
         
      // your accessory must have an AccessoryInformation service
      this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Alpha Ess Plugin by Jens Zeidler")
      .setCharacteristic(this.api.hap.Characteristic.Model, "Alpha Ess ");
      
      
      //this.service = new this.api.hap.Service.Switch(config.name);

      //this.service = new this.api.hap.Service.BatteryService(config.name, "hvBatteryLevel")
//      this.service = new this.api.hap.Service.Battery(config.name, "hvBatteryLevel")

      //this.service = new this.api.hap.Service.Battery(config.name)
      this.service = new this.api.hap.Service.Lightbulb(config.name)

      this.service.getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
        .onGet(this.handleStatusLowBatteryGet.bind(this));


      this.service.getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
      .onGet(this.handleStatusBattery.bind(this));
    
      this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.getOnStatus.bind(this))
      .onSet(this.setOnStatus.bind(this));

      this.service.getCharacteristic(this.api.hap.Characteristic.Brightness)
      .onGet(this.handleStatusBattery.bind(this))
     
  
      this.serialnumber = config.serialnumber;
      this.alphaService =  new AlphaService(this.log, config.username, config.password, config.logrequestdata);

  
      if (!this.serialnumber || !this.username || !this.password){
        this.log.error("Configuration was missing: either serialnumber, password or username not present")
      }
     
    } 

    async fetchAlphaEssData(serialNumber: string ){
      this.log.debug("fetch Alpha ESS Data -> fetch token");
      var token = await this.alphaService.login();
      this.log.debug("fetch Alpha ESS Data -> get detail data");
      var response = await this.alphaService.getDetailData(token, serialNumber);
      this.log.debug("SOC: " + response.data.soc);
      this.batteryLevel = response.data.soc;

      }
    
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

  
      identify(): void {
        this.log.debug('Identify');
      }

      setOnStatus(value) {
        this.log.debug('Triggered SET ON Status');

        return 0;
      }
      handleStatusLowBatteryGet() {
        this.log.debug('Triggered GET StatusLowBattery');
  
        // set this to a valid value for StatusLowBattery
        const currentValue = this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  
        return currentValue;
    }
    handleStatusBattery() {
        this.fetchAlphaEssData(this.serialnumber);
        this.log.debug('Triggered GET Battery Level');
        // set this to a valid value for StatusLowBattery
        return this.batteryLevel;
    }

    // alpha ess methods 
  

   a
  

}
