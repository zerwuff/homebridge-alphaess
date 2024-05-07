
import { HAP, API, Characteristic, PlatformConfig, Logging } from 'homebridge';
import { AlphaService } from './index';
import { AlphaMqttService, MqttTopics } from './index';
import { ImageRenderingService } from './index';
import { BasePlugin } from './BasePlugin';
import { AlphaLastPowerDataResponse } from './alpha/response/AlphaLastPowerDataResponse';

export class AlphaHumidityPlugin extends BasePlugin {

  private alphaImageService: ImageRenderingService;

  private power_image_filename; // filename for image rendering

  // alpha mqtt service
  private mqtt: AlphaMqttService;

  // Alpha ESS Battery Percentage Plugin
  constructor (log: Logging, config: PlatformConfig, api: API, alphaService: AlphaService) {
    super(log, config, api, alphaService, 'AlphaEssBatteryHumidity' );


    this.power_image_filename = config.power_image_filename;
    this.alphaImageService = new ImageRenderingService();

    if (config.mqtt_url===undefined ){
      log.debug('mqtt_url is not set, not pushing anywhere');
    } else{
      const topics = new MqttTopics();
      topics.mqtt_status_topic = config.mqtt_status_topic;
      this.mqtt = new AlphaMqttService(log, config.mqtt_url, topics);
    }
  }

  // create light sensor for current total power
  initServiceCharacteristics(hap: HAP) {
    this.setService(new hap.Service.HumiditySensor(this.getName()));
    this.getCharacteristics().onGet(this.handleGet.bind(this));
    this.getCharacteristics().setProps({minValue:0});
  }


  getCharacteristics(): Characteristic {
    return this.getService().getCharacteristic(this.getHAP().Characteristic.CurrentRelativeHumidity);
  }


  onResponse(detailData: AlphaLastPowerDataResponse) {
    const batteryLevel = detailData.data.soc;
    this.setValue(batteryLevel);

    const totalPower = this.getAlphaService().getTotalPower(detailData);

    if (this.mqtt !== undefined) {
      this.mqtt.pushStatusMsg(totalPower, detailData.data.soc);
    }

    if (this.getService()!==null && batteryLevel !== undefined && batteryLevel !== null) {
      this.getCharacteristics().updateValue(batteryLevel);
    }

    this.alphaImageService.renderImage(this.power_image_filename, this.getAlphaService().getDailyMap());
  }


}
