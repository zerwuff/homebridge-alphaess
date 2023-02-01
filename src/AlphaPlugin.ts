
import { timeStamp } from 'console';
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, BridgeConfiguration } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"

export class AlphaPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private contactSensorService: Service;

  private api: API;
  private log: Logger;
  private config: AccessoryConfig;

  private username: string;
  private password: string;
  private serialnumber: string;
  private bearer: string;
  private refreshTimerInterval: number; // timer milliseconds to check timer 

  // alpha ess status variables 
  private batteryLevel: number;
  private batteryPower: number;

  // threshold for triggering the loading trigger
  private powerLoadingThreshold: number; // minimum power to load 
  private socLoadingThreshold: number; // minimum soc to load 

  // true / false trigger 
  private trigger: boolean;


  constructor(log, config: AccessoryConfig, api: API) {
    this.api = api;
    this.log = log;
    this.batteryLevel = 0;
    this.refreshTimerInterval = 10000;
    this.config = config;
    log.debug('Alpha ESS Accessory Loaded');

    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Alpha Ess Homebridge Plugin by Jens Zeidler")
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.api.hap.Characteristic.Model, "Alpha ESS Battery Storage ");
    
     this.service = new this.api.hap.Service.Lightbulb(config.name)

    // this.service = new this.api.hap.Service.Battery(config.name)

    this.service.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.getOnStatus.bind(this))
      .onSet(this.setOnStatus.bind(this));

    this.service.getCharacteristic(this.api.hap.Characteristic.Brightness)
      .onGet(this.handleStatusBattery.bind(this))


    this.contactSensorService =  new this.api.hap.Service.ContactSensor("loadingSensor");


    this.serialnumber = config.serialnumber;
    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata);


    this.log.debug(config.serialnumber);
    this.log.debug(config.username);
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
          }, config.refreshTimerInterval);
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
            this.batteryPower = detailData.data.pbat;
            
            this.trigger = this.alphaService.calculateTrigger(detailData, this.config.powerLoadingThreshold, this.config.socLoadingThreshold); 
            this.log.debug("Trigger value:"+ this.trigger); 
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

  handleContactSensorStateGet() {
    this.log.debug('Triggered GET ContactSensorState');

    // set this to a valid value for ContactSensorState
    if (this.trigger == false){
      this.log.debug('CONTACT DETECTED');
      return this.api.hap.Characteristic.ContactSensorState.CONTACT_DETECTED;
    }
    this.log.debug('CONTACT _NOT_ DETECTED');
    return this.api.hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }



  handleSerialNumberGet() {
    return this.serialnumber;
  }

  identify(): void {
    this.log.debug('Its me, Alpha cloud plugin');
  }

  getOnStatus() {
    let isCharging  = (this.batteryLevel > 0 );
    this.log.debug('Alpha Ess Charging state: ' + isCharging);
    return isCharging ;
  }

  setOnStatus(value) {
    let isCharging  = (this.batteryLevel > 0 );
    this.log.debug('Alpha Ess Charging state: ' + isCharging);
    return isCharging;
  }
 
  handleStatusBattery(): number {
    this.fetchAlphaEssData(this.serialnumber);
    this.log.debug('Alpha Ess battery level');
    return this.batteryLevel;
  }

}
