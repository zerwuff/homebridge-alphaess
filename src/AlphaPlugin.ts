
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"

export class AlphaPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private api: API;
  private log: Logger;


  private username: string;
  private password: string;
  private serialnumber: string;
  private bearer: string;

  // alpha ess status variables 
  private batteryLevel: number;
  private batteryPower: number;

  constructor(log, config: AccessoryConfig, api: API) {
    this.api = api;
    this.log = log;
    this.batteryLevel = 0;
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


    this.serialnumber = config.serialnumber;
    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata);


    this.log.debug(config.serialnumber);
    this.log.debug(config.username);
    if (!config.serialnumber || !config.username || !config.password) {
      this.log.error("Configuration was missing: either serialnumber, password or username not present")
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
