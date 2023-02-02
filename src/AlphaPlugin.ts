
import { timeStamp } from 'console';
import { HAP, API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, PlatformAccessory, PlatformConfig, Service, Characteristic, BridgeConfiguration, Logging } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"

export class AlphaPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;

  private hap: HAP ;
  private log: Logging;
  private name: string; // this attribute is required for registreing the accessoryplugin 

  private serialnumber: string;
  private refreshTimerInterval: number; // timer milliseconds to check timer 

  // alpha ess status variables 
  private batteryLevel: number;


  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.batteryLevel = 0;
    this.refreshTimerInterval = 10000;
    this.name= "AlphaEssBattery";
    
    log.debug('Alpha ESS Accessory Loaded');

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, "Alpha Ess Homebridge Plugin by Jens Zeidler")
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, "Alpha ESS Battery Storage ");
    
     this.service = new this.hap.Service.HumiditySensor(this.name)


         // create handlers for required characteristics
    this.service.getCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity)
         .onGet(this.handleCurrentRelativeHumidityGet.bind(this));


    this.serialnumber = config.serialnumber
    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata); 
  
    if (!config.serialnumber || !config.username || !config.password) {
      this.log.error("Configuration was missing: either serialnumber, password or username not present")
    }

    if (!config.refreshTimerInterval ) {
      this.log.error("refreshTimerInterval is not set, not refreshing trigger data ")
    }
    else {
      this.refreshTimerInterval = config.refreshTimerInterval
       // auto refresh statistics
        setInterval(() => {
    
             this.log.debug("Running Timer to check trigger every  " + config.refreshTimerInterval + " ms "); 
              this.fetchAlphaEssData(config.serialnumber); 
          }, this.refreshTimerInterval);
    }
  }

  async fetchAlphaEssData(serialNumber: string) {
    this.log.debug("fetch Alpha ESS Data -> fetch token");
    var response = await this.alphaService.login().then(loginResponse => {

      if (loginResponse.data != undefined && loginResponse.data.AccessToken != undefined) {
        this.log.debug("Logged in to alpha cloud, trying to fetch detail data")      
      
        this.alphaService.getDetailData(loginResponse.data.AccessToken, serialNumber).then(
          detailData => {      
            this.log.debug("SOC: " + detailData.data.soc);
            this.batteryLevel = detailData.data.soc;                  
          }
        )
      }else {
        this.log.error("Could not login to Alpha Cloud, please check username or password")      
      }
    });

  }


  getServices() {
    return [
      this.informationService,
      this.service
    ];
  }


  handleSerialNumberGet() {
    return this.serialnumber;
  }

  identify(): void {
    this.log.debug('Its me, Alpha cloud plugin');
  }
 

  handleCurrentRelativeHumidityGet() {
    this.log.debug('Alpha Ess battery level');
    this.fetchAlphaEssData(this.serialnumber);
    return this.batteryLevel;
  }

}