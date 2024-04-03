
import { HAP, API, AccessoryPlugin, PlatformConfig, Service, Logging, Topics } from 'homebridge';
import { AlphaService } from './index';
import { AlphaMqttService, MqttTopics } from './index';
import { ImageRenderingService } from './index';

export class AlphaLightPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private alphaImageService: ImageRenderingService;

  private hap: HAP ;
  private log: Logging;
  private name: string; // this attribute is required for registreing the accessoryplugin

  private serialnumber: string;
  private refreshTimerInterval: number; // timer milliseconds to check timer
  private power_image_filename; // filename for image rendering

  // alpha ess status variables
  private totalPower: number;

  // Alpha ESS Battery Percentage Plugin
  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.totalPower = 0;
    this.refreshTimerInterval = 10000;
    this.name= 'AlphaEssBatteryLightLevel';

    log.debug('Alpha ESS Accessory Loaded');
    this.alphaImageService = new ImageRenderingService();
    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Alpha Ess Homebridge Light Level Plugin by Jens Zeidler')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS Battery Storage');

    // create light sensor for current power
    this.service = new this.hap.Service.LightSensor(this.name);
    this.service.getCharacteristic(this.hap.Characteristic.CurrentAmbientLightLevel)
      .onGet(this.handleCurrentLightLevelGet.bind(this));


    this.serialnumber = config.serialnumber;
    this.power_image_filename = config.power_image_filename;
    this.alphaService = new AlphaService(this.log, config.appid, config.appsecret, config.logrequestdata, config.alphaUrl);

    if (!config.serialnumber || !config.appid || !config.appsecret) {
      this.log.error('Configuration was missing: either appid or appsecret not present');
    }

    if (!config.refreshTimerInterval ) {
      this.log.error('refreshTimerInterval is not set, not refreshing trigger data ');
    } else {
      this.refreshTimerInterval = config.refreshTimerInterval + Math.floor(Math.random() * 10000) ;
      // auto refresh statistics
      setInterval(() => {
        this.log.debug('Running Timer to check trigger every  ' + this.refreshTimerInterval + ' ms ');
        this.fetchAlphaEssData(config.serialnumber);
      }, this.refreshTimerInterval);
    }

    this.fetchAlphaEssData(config.serialnumber);
  }

  async fetchAlphaEssData(serialNumber: string) {
    this.log.debug('fetch Alpha ESS Data -> fetch token');

    this.alphaService.getLastPowerData(serialNumber).then(
      detailData => {
        if (detailData!==null && detailData.data!==null){
          this.log.debug('SOC: ' + detailData.data.soc);
          const totalPower = this.alphaService.getTotalPower(detailData);
          this.totalPower = totalPower;
        }
      },
    ).catch(error => {
      this.log.error(error);
      this.log.error('Getting Detail Data from Alpha Ess failed ');
      return;
    });

  }

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }


  handleSerialNumberGet() {
    return this.serialnumber;
  }

  identify(): void {
    this.log.debug('Its me, Alpha light plugin');
  }


  handleCurrentLightLevelGet(){
    return this.totalPower;
  }

}
