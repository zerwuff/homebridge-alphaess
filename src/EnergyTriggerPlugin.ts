
import { HAP, API, AccessoryPlugin, Logging, PlatformConfig, Service } from 'homebridge';
import { AlphaService, BASE_URL } from './alpha/AlphaService.js';
import { AlphaMqttService, MqttTopics } from './alpha/mqtt/AlphaMqttService.js';
import { TibberService } from './tibber/TibberService.js';
import { AlphaTrigger } from './interfaces.js';
import { ImageRenderingService } from './alpha/ImageRenderingService.js';
import { Utils } from './util/Utils.js';
/**
 * This Plugin provides a homebridge trigger logic that can be used to control external devices.
 *
 */
export class EnergyTriggerPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;

  private hap: HAP;
  private log: Logging;
  private config: PlatformConfig;
  private name: string; // REQUIRED !!
  private refreshTimerInterval: number; // timer milliseconds to check timer

  private triggerTotal: boolean;
  private triggerAlpha : boolean;
  private triggerTibber: boolean;
  private triggerReloadBattryTrigger : boolean;
  private triggerImageFilename: string;
  private socCurrent: number;
  private tibberThresholdSOC: number;// soc percentage to trigger tibber loading
  private lastClearDate: Date ;
  private alphaImageService: ImageRenderingService;

  private alphaTriggerMap: Map<number, AlphaTrigger>;
  private utils: Utils;
  // alpha mqtt service
  private mqtt: AlphaMqttService;
  private tibber: TibberService;
  private isBatteryLoadingFromNet = false;

  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.refreshTimerInterval = 10000;
    this.alphaTriggerMap = new Map();
    this.socCurrent = -1;
    this.config = config;
    this.triggerAlpha = false;
    this.triggerTibber = false;
    this.utils = new Utils();
    this.name= 'EnergyTriggerPlugin';
    this.lastClearDate = new Date();
    this.lastClearDate.setHours(0);
    this.lastClearDate.setMinutes(0);
    this.lastClearDate.setMinutes(1);
    this.isBatteryLoadingFromNet = false;

    log.debug('EnergyTriggerPlugin plugin loaded');

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, 'EnergyTriggerPlugin by Jens Zeidler')
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS // Tibber combined Trigger Plugin');

    this.service = new this.hap.Service.ContactSensor(config.name);

    this.service.getCharacteristic(this.hap.Characteristic.ContactSensorState)
      .onGet(this.handleContactSensorStateGet.bind(this));

    this.alphaImageService = new ImageRenderingService();
    this.alphaService = new AlphaService(this.log, config.username, config.password, config.logrequestdata, BASE_URL);

    this.log.debug(config.serialnumber);
    this.log.debug(config.username);

    this.triggerImageFilename = config.triggerImageFilename;
    if (!config.serialnumber || !config.username || !config.password) {
      this.log.debug('Alpha ESS trigger is disabled: either serialnumber, password or username not present');
    }

    if (!config.tibberEnabled ) {
      this.log.debug('Tibber API trigger is disabled');
    } else {
      this.log.debug('Tibber API trigger is enabled');
      this.tibber = new TibberService(log, config.tibberAPIKey, config.tibberUrl, config.tibberThresholdEur,
        config.tibberLoadBatteryEnabled, config.tibberHomeId);
    }

    if (!config.refreshTimerInterval ) {
      this.log.error('refreshTimerInterval is not set, not refreshing trigger data ');
    } else {
      this.refreshTimerInterval = config.refreshTimerInterval;
      // auto refresh statistics
      setInterval(() => {
        this.log.debug('Running Timer to check trigger every  ' + config.refreshTimerInterval + ' ms ');
        this.calculateCombinedTriggers(config);
      }, this.refreshTimerInterval);
    }

    this.calculateCombinedTriggers(config);

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

  async calculateCombinedTriggers(config: PlatformConfig){
    this.calculateAlphaTrigger(config.serialnumber).catch(error => {
      this.log(error);
    });

    if (config.tibberEnabled ) {
      this.tibberThresholdSOC = config.tibberThresholdSOC;
      this.calculateTibberTrigger(this.tibber).catch(error => {
        this.log(error);
      });
    }

    let tibberMap = new Map();
    if (this.tibber !== undefined){
      tibberMap = this.tibber.getDailyMap();
    }

    await this.alphaImageService.renderTriggerImage(this.triggerImageFilename, tibberMap,
      this.alphaTriggerMap, this.tibber.getPricePoint(),
    ).catch(error => {
      this.log.error('error rendering image: ', error);
    });
  }


  async calculateTibberTrigger(tibber: TibberService) {
    try {
      await tibber.isTriggered(this.socCurrent, this.tibberThresholdSOC).then(result => {
        this.triggerTibber = result;
      }).catch(() => {
        this.triggerTibber = false;
      });
    } catch (err){
      this.log.error('' + err);
    }
  }

  async calculateAlphaTrigger(serialNumber: string) {
    this.triggerAlpha = false;
    this.log.debug('fetch Alpha ESS Data -> fetch token');
    await this.alphaService.login().then(loginResponse => {

      if (loginResponse.data !== undefined && loginResponse.data.AccessToken !== undefined) {
        this.log.debug('Logged in to alpha cloud, trying to fetch detail data');

        const priceIsLow = this.triggerTibber;
        const socBattery = this.socCurrent;
        const socBatteryThreshold = this.tibberThresholdSOC;

        // check battery reloading

        if (this.config.tibberEnabled && this.tibber.getTibberLoadingBatteryEnabled() ) {
          this.log.debug('Check reloading of battery triggered ');
          this.alphaService.checkAndEnableReloading(
            loginResponse.data.AccessToken,
            serialNumber,
            priceIsLow,
            socBattery,
            socBatteryThreshold).then(
            () => {
              this.log.debug('Check reloading if battery from net was done.');
            },
          ) .catch(error => {
            this.log.error('Error Checking Battery Loading via Tibber price trigger ' + error);
            return;
          });

          this.alphaService.isBatteryCurrentlyLoading(loginResponse.data.AccessToken, serialNumber).then(
            batteryLoading => {
              this.isBatteryLoadingFromNet = batteryLoading;
            }).catch(error => {
            this.isBatteryLoadingFromNet = false;
            this.log.error('Error Checking Battery currently loading not possible ' + error);
            return;
          });

        }

        this.alphaService.getDetailData(loginResponse.data.AccessToken, serialNumber).then(
          detailData => {
            if (detailData!==null && detailData.data!==null){
              this.log.debug('SOC: ' + detailData.data.soc);
              this.socCurrent = detailData.data.soc;
              this.triggerAlpha= this.alphaService.isTriggered(
                detailData, this.config.powerLoadingThreshold, this.config.socLoadingThreshold);

              const now = new Date();
              const hours = now.getHours();
              const min = now.getMinutes();
              const index = hours * 4 + Math.round(min/15);
              this.alphaTriggerMap.set(index, new AlphaTrigger(this.triggerAlpha ? 1:0, this.isBatteryLoadingFromNet, new Date()));

              if (this.utils.isNewDate(now, this.lastClearDate)){
                // day switch, empty cache
                this.alphaTriggerMap.clear();
                if (this.tibber !== undefined){
                  this.tibber.getDailyMap().clear();
                }
                this.lastClearDate = now;
              }
            }
          },
        ).catch(error => {
          this.log.error('Getting Statistics Data from Alpha Ess failed ' + error);
          return;
        });

      }else {
        this.log.error('Could not login to Alpha Cloud, please check username or password');
      }
    }).catch(error => {
      this.log.error('Login to Alpha Ess failed ' + error);
    });
  }



  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  handleContactSensorStateGet() {
    this.triggerTotal = this.triggerAlpha || this.triggerTibber;
    this.log.debug('Trigger: alpha ess: '+ this.triggerAlpha + ' tibber: ' + this.triggerTibber + ' total:'+this.triggerTotal);
    this.log.debug('Triggered GET ContactSensorState');

    // set this to a valid value for ContactSensorState
    if (this.mqtt !== undefined) {
      this.mqtt.pushTriggerMessage(this.triggerTotal);
    }

    if (this.triggerTotal === false){
      this.log.debug('trigger not fired -> status CONTACT_DETECTED');
      return this.hap.Characteristic.ContactSensorState.CONTACT_DETECTED;
    }
    this.log.debug('trigger fired -> status CONTACT_NOT_DETECTED');
    return this.hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }


  identify(): void {
    this.log.debug('Its me, Energy contact sensor trigger plugin');
  }


}
