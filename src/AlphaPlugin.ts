
import { HAP, API, AccessoryPlugin, PlatformConfig, Service, Logging, Topics } from 'homebridge';
import { AlphaService, BASE_URL } from './alpha/AlphaService.js';
import { AlphaMqttService, MqttTopics } from './alpha/mqtt/AlphaMqttService';
import { AlphaImageService } from './alpha/AlphaImageService.js';

export class AlphaPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private alphaImageService: AlphaImageService;

  private hap: HAP ;
  private log: Logging;
  private name: string; // this attribute is required for registreing the accessoryplugin

  private serialnumber: string;
  private refreshTimerInterval: number; // timer milliseconds to check timer

  // alpha ess status variables
  private batteryLevel: number;

  // alpha mqtt service
  private mqtt: AlphaMqttService;

  // Alpha ESS Battery Percentage Plugin
  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.batteryLevel = 0;
    this.refreshTimerInterval = 10000;
    this.name= 'AlphaEssBattery';

    log.debug('Alpha ESS Accessory Loaded');
    this.alphaImageService = new AlphaImageService(config.power_image_filename);
    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Alpha Ess Homebridge Percentage Plugin by Jens Zeidler')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS Battery Storage ');

    this.service = new this.hap.Service.HumiditySensor(this.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleCurrentRelativeHumidityGet.bind(this));


    this.serialnumber = config.serialnumber;
    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata, BASE_URL);

    if (!config.serialnumber || !config.username || !config.password) {
      this.log.error('Configuration was missing: either serialnumber, password or username not present');
    }

    if (!config.refreshTimerInterval ) {
      this.log.error('refreshTimerInterval is not set, not refreshing trigger data ');
    } else {
      this.refreshTimerInterval = config.refreshTimerInterval;
      // auto refresh statistics
      setInterval(() => {
        this.log.debug('Running Timer to check trigger every  ' + config.refreshTimerInterval + ' ms ');
        this.fetchAlphaEssData(config.serialnumber);
      }, this.refreshTimerInterval);
    }

    if (config.mqtt_url===undefined ){
      this.log.debug('mqtt_url is not set, not pushing anywhere');
    } else{
      const topics = new MqttTopics();
      topics.mqtt_status_topic = config.mqtt_status_topic;
      this.mqtt = new AlphaMqttService(log, config.mqtt_url, topics);
    }

  }

  async fetchAlphaEssData(serialNumber: string) {
    this.log.debug('fetch Alpha ESS Data -> fetch token');
    await this.alphaService.login().then(loginResponse => {

      if (loginResponse.data != undefined && loginResponse.data.AccessToken !== undefined) {
        this.log.debug('Logged in to alpha cloud, trying to fetch detail data');

        this.alphaService.getDetailData(loginResponse.data.AccessToken, serialNumber).then(
          detailData => {
            this.log.debug('SOC: ' + detailData.data.soc);
            this.batteryLevel = detailData.data.soc;
            const totalPower = this.alphaService.getTotalPower(detailData);
            if (this.mqtt !== undefined) {
              this.mqtt.pushStatusMsg(totalPower, detailData.data.soc);
            }
          },
        ).catch(error => {
          this.log.error('Getting Detail Data from Alpha Ess failed ');
          return;
        });

        this.log.debug('Getting statistics Data from Alpha Ess ');

        this.alphaService.getStatisticsData(loginResponse.data.AccessToken, serialNumber).then(
          statisticData => {
            this.log.debug('Rendering image from statistics data: ');
            try {
              this.log.debug('Response from statistics data : ' + JSON.stringify(statisticData));
              this.alphaImageService.renderImage(statisticData);
            } catch (ex) {
              this.log.error('Could not render from statistics data: ' + ex);
            }
          },
        ).catch(error => {
          this.log.error('Getting Statistics Data from Alpha Ess failed ');
          return;
        });

        this.alphaService.getSettingsData(loginResponse.data.AccessToken, serialNumber).then(
          settings => {
            this.log.debug('Settings Data : ');
            this.log.debug('' + JSON.stringify(settings));
            this.log.debug('' + JSON.stringify(settings['data']));

            this.alphaService.setBatteryCharge(loginResponse.data.AccessToken, serialNumber, settings.data);

          },
        );

      }else {
        this.log.error('Could not login to Alpha Cloud, please check username or password');
      }
    }).catch(error => {
      this.log.error('Login to Alpha Ess failed');
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
    this.log.debug('Its me, Alpha cloud plugin');
  }


  handleCurrentRelativeHumidityGet() {
    this.fetchAlphaEssData(this.serialnumber);
    return this.batteryLevel;
  }

}
