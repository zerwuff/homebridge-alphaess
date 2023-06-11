
import { HAP, API, AccessoryPlugin, Logging, PlatformConfig, Service } from 'homebridge';
import { AlphaService, BASE_URL } from './alpha/AlphaService.js';
import { AlphaMqttService, MqttTopics } from './alpha/mqtt/AlphaMqttService';


/**
 * This Plugin provides a homebridge trigger logic that can be used to control external devices.
 *
 */
export class AlphaTriggerPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;

  private hap: HAP;
  private log: Logging;
  private config: PlatformConfig;
  private name: string;
  private refreshTimerInterval: number; // timer milliseconds to check timer

  // true / false trigger
  private trigger: boolean;

  private tibberApiKey: string;
  private tibberQueryUrl: string;

  // alpha mqtt service
  private mqtt: AlphaMqttService;

  // Alpha ESS Trigger Plugin
  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.refreshTimerInterval = 10000;
    this.config = config;
    this.name= 'AlphaEssTrigger';
    log.debug('Alpha ESS Trigger plugin loaded');

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Alpha Ess Homebridge Trigger Plugin by Jens Zeidler')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS Trigger Plugin');

    this.service = new this.hap.Service.ContactSensor(config.name);

    this.service.getCharacteristic(this.hap.Characteristic.ContactSensorState)
      .onGet(this.handleContactSensorStateGet.bind(this));

    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata, BASE_URL);

    this.log.debug(config.serialnumber);
    this.log.debug(config.username);
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

    if (this.config.mqtt_url===undefined ){
      this.log.debug('mqtt_url is not set, not pushing anywhere');
    } else{
      const topics = new MqttTopics();
      topics.mqtt_status_topic = config.mqtt_status_topic;
      topics.mqtt_trigger_topic_true = this.config.mqtt_trigger_topic_true;
      topics.mqtt_trigger_topic_false= this.config.mqtt_trigger_topic_false;
      topics.mqtt_trigger_message_true = this.config.mqtt_trigger_message_true;
      topics.mqtt_trigger_message_false = this.config.mqtt_trigger_message_false;
      this.mqtt = new AlphaMqttService(log, config.mqtt_url, topics);
    }
  }

  async fetchAlphaEssData(serialNumber: string) {
    this.log.debug('fetch Alpha ESS Data -> fetch token');
    await this.alphaService.login().then(loginResponse => {

      if (loginResponse.data !== undefined && loginResponse.data.AccessToken !== undefined) {
        this.log.debug('Logged in to alpha cloud, trying to fetch detail data');

        this.alphaService.getDetailData(loginResponse.data.AccessToken, serialNumber).then(
          detailData => {
            this.log.debug('SOC: ' + detailData.data.soc);

            this.trigger = this.alphaService.isTriggered(
              detailData,
              this.config.powerLoadingThreshold,
              this.config.socLoadingThreshold);
            this.log.debug('Trigger value: '+ this.trigger);

            this.handleContactSensorStateGet();
          },
        ).catch(error => {
          this.log.error('Getting Statistics Data from Alpha Ess failed ');
          return;
        });
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

  handleContactSensorStateGet() {
    this.log.debug('Triggered GET ContactSensorState');

    // set this to a valid value for ContactSensorState
    if (this.mqtt !== undefined) {
      this.mqtt.pushTriggerMessage(this.trigger);
    }

    if (this.trigger === false){
      this.log.debug('trigger not fired -> status CONTACT_DETECTED');
      return this.hap.Characteristic.ContactSensorState.CONTACT_DETECTED;
    }
    this.log.debug('trigger fired -> status CONTACT_NOT_DETECTED');
    return this.hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }


  identify(): void {
    this.log.debug('Its me, Alpha cloud contact sensor trigger plugin');
  }


}
