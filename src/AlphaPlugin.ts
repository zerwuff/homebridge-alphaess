
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"
import { off, report } from 'process';
import { json } from 'stream/consumers';


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

  private batteryLevel: number;

  constructor(log, config: AccessoryConfig, api: API) {
    this.api = api;
    this.log = log;
    this.batteryLevel = 0;
    log.debug('Alpha ESS Accessory Loaded');

    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Alpha Ess Plugin by Jens Zeidler")
      .setCharacteristic(this.api.hap.Characteristic.Model, "Alpha Ess ");


    this.service = new this.api.hap.Service.Lightbulb(config.name)

    this.service.getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
      .onGet(this.handleStatusBattery.bind(this));

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
        this.log.error("Logged in to alpha cloud, trying to fetch detail data")      
      
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


  getOnStatus(someObject: object) {
    this.log.debug('Triggered GET ON Status');
    return 1;
  }


  identify(): void {
    this.log.debug('Its me, Alpha cloud plugin');
  }

  setOnStatus(value) {
    this.log.debug('Triggered SET ON Status');
    return 1;
  }
 
  handleStatusBattery() {
    this.fetchAlphaEssData(this.serialnumber);
    this.log.debug('Triggered GET Battery Level');
    // set this to a valid value for StatusLowBattery
    return this.batteryLevel;
  }

}
