
import { HAP, API, AccessoryPlugin, PlatformConfig, Service, Logging, Topics } from 'homebridge';
import { AlphaService } from './index';
import { AlphaMqttService, MqttTopics } from './index';
import { ImageRenderingService } from './index';
import { AlphaServiceEventListener } from './interfaces';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';

export class AlphaHumidityPlugin implements AccessoryPlugin, AlphaServiceEventListener<AlphaLastPowerDataResponse> {

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
  private batteryLevel: number;

  // alpha mqtt service
  private mqtt: AlphaMqttService;

  // Alpha ESS Battery Percentage Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService : AlphaService) {
    this.hap = api.hap;
    this.log = log;
    this.batteryLevel = 0;
    this.refreshTimerInterval = 10000;
    this.name= 'AlphaEssBatteryHumidity';
    this.power_image_filename = config.power_image_filename;
    log.debug('Alpha ESS Accessory Loaded');
    this.alphaImageService = new ImageRenderingService();
    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Alpha Ess Homebridge Humidity Percentage Plugin by Jens Zeidler')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS Battery Storage');

    this.service = new this.hap.Service.HumiditySensor(this.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleCurrentRelativeHumidityGet.bind(this));

    this.alphaService = alphaService;
    alphaService.addListener(this);

    if (config.mqtt_url===undefined ){
      this.log.debug('mqtt_url is not set, not pushing anywhere');
    } else{
      const topics = new MqttTopics();
      topics.mqtt_status_topic = config.mqtt_status_topic;
      this.mqtt = new AlphaMqttService(log, config.mqtt_url, topics);
    }
  }

  getName(){
    return this.name;
  }

  onResponse(detailData: AlphaLastPowerDataResponse) {
    this.batteryLevel = detailData.data.soc;
    const totalPower = this.alphaService.getTotalPower(detailData);
    if (this.mqtt !== undefined) {
      this.mqtt.pushStatusMsg(totalPower, detailData.data.soc);
    }

    if (this.hap !== undefined){
      if (this.batteryLevel !== undefined && this.batteryLevel !== null) {
        this.service.getCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity).updateValue(this.batteryLevel);
      }
    }

    this.log.debug('Rendering Image');
    this.alphaImageService.renderImage(this.power_image_filename, this.alphaService.getDailyMap());
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
    this.log.debug('Its me, Alpha cloud plugin');
  }


  handleCurrentRelativeHumidityGet() {
    return this.batteryLevel;
  }

}
