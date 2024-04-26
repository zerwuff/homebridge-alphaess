
import { HAP, API, AccessoryPlugin, Logging, PlatformConfig, Service } from 'homebridge';
import { AlphaTrigger } from './index';
import { ImageRenderingService } from './index';
import { Utils } from './index';
import { AlphaService } from './index';
import { AlphaMqttService, MqttTopics } from './index';
import { TibberService } from './index';
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
  private tibberLoadingMinutes: number;
  private dailyLoadingFromNetReset : boolean;

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
    this.dailyLoadingFromNetReset = false;
    this.triggerTotal = false;
    this.triggerAlpha = false;
    this.triggerTibber = false;


    log.debug('EnergyTriggerPlugin plugin loaded');
    this.setCharacteristics(this.hap, this.config);

    this.alphaImageService = new ImageRenderingService();
    this.alphaService = new AlphaService(this.log, config.appid, config.appsecret, config.logrequestdata, config.alphaUrl);
    this.log.debug(config.serialnumber);
    this.tibberLoadingMinutes = config.tibberLoadingMinutes;

    this.triggerImageFilename = config.triggerImageFilename;
    if (!config.serialnumber || !config.appid || !config.appsecret) {
      this.log.debug('Alpha ESS trigger is disabled: either serialnumber, appid or appsecret not present');
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
      this.refreshTimerInterval = config.refreshTimerInterval + Math.floor(Math.random() * 10000) ;
      // auto refresh statistics
      setInterval(() => {
        this.log.debug('Running Timer to check trigger every  ' + this.refreshTimerInterval + ' ms ');
        this.calculateCombinedTriggers(config);
      }, this.refreshTimerInterval );
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

  setTibberService(tibberService: TibberService){
    this.tibber = tibberService;
  }

  setAlphaService(alphaService: AlphaService){
    this.alphaService = alphaService;
  }

  getAlphaService(){
    return this.alphaService;
  }

  getTibberService(){
    return this.tibber;
  }

  setSocCurrent(soc:number){
    this.socCurrent = soc;
  }

  setTibberTrigger(triggerTibber:boolean){
    this.triggerTibber = triggerTibber;
  }

  setCharacteristics(hap:HAP, config:PlatformConfig){

    if (hap !== undefined){
      this.informationService = new hap.Service.AccessoryInformation()
        .setCharacteristic(this.hap.Characteristic.Manufacturer, 'EnergyTriggerPlugin by Jens Zeidler')
        .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
        .setCharacteristic(this.hap.Characteristic.Model, 'Alpha ESS // Tibber combined Trigger Plugin');

      this.service = new this.hap.Service.ContactSensor(config.name);

      this.service.getCharacteristic(this.hap.Characteristic.ContactSensorState)
        .onGet(this.handleContactSensorStateGet.bind(this));
    }
  }

  getTriggerTotal(){
    return this.triggerTotal;
  }

  calculateCombinedTriggers(config: PlatformConfig){

    this.calculateAlphaTrigger(config.serialnumber).catch(error => {
      this.log(error);
    });

    this.triggerTotal = this.triggerAlpha || this.triggerTibber;

    if (config.tibberEnabled ) {
      this.tibberThresholdSOC = config.tibberThresholdSOC;
      this.calculateTibberTrigger(this.tibber).catch(error => {
        this.log(error);
      });
    }


    this.triggerTotal = this.triggerAlpha || this.triggerTibber;
    this.log.debug('Calculated triggers: alpa ess: '+ this.triggerAlpha + ' tibber: ' + this.triggerTibber +
            ' triggerTotal :'+this.triggerTotal);

    //refresh combined trigger
    if (this.hap !== undefined){
      this.handleContactSensorStateGet();
      this.log.debug('Updating sensor status to: ' + this.triggerTotal);
      this.pushMqtt(this.triggerTotal);
      this.service.getCharacteristic(this.hap.Characteristic.ContactSensorState).updateValue(this.getContactSensorState(this.triggerTotal));
    }

    // render image
    let tibberMap = new Map();
    let tibberPricePoint = -1 ;
    if (this.tibber !== undefined){
      tibberMap = this.tibber.getDailyMap();
      tibberPricePoint = this.tibber.getPricePoint();
    }

    if (this.triggerImageFilename!==undefined){
      this.alphaImageService.renderTriggerImage(this.triggerImageFilename, tibberMap,
        this.alphaTriggerMap, tibberPricePoint,
      ).catch(error => {
        this.log.error('error rendering image: ', error);
      });
    }
  }


  async calculateTibberTrigger(tibber: TibberService) {
    try {
      await tibber.isTriggered(this.socCurrent, this.tibberThresholdSOC).
        then(result => {
          this.setTibberTrigger(result);
        }).catch(() => {
          this.log.error('could not fetch trigger result ');
        });
    } catch (err){
      this.log.error('' + err);
    }
    return this.triggerTibber;
  }

  async calculateAlphaTrigger(serialNumber: string) {
    this.triggerAlpha = false;
    this.log.debug('calculateAlphaTrigger called.');

    const priceIsLow = this.triggerTibber;
    const socBattery = this.socCurrent;
    const socBatteryThreshold = this.tibberThresholdSOC;

    // check battery reloading

    if (this.config.tibberEnabled && this.tibber.getTibberLoadingBatteryEnabled() ) {
      this.log.debug('Check reloading of battery triggered');
      this.alphaService.checkAndEnableReloading(
        serialNumber,
        priceIsLow,
        this.tibberLoadingMinutes,
        socBattery,
        socBatteryThreshold).then(
        () => {
          this.log.debug('Check reloading if battery from net was done.');
        },
      ) .catch(error => {
        this.log.error('Error Checking Battery Loading via Tibber price trigger: ' + error);
        return;
      });

      this.alphaService.isBatteryCurrentlyLoadingCheckNet(serialNumber).then(
        batteryLoading => {
          this.isBatteryLoadingFromNet = batteryLoading;
          this.log.debug('Loading Battery Satus from Net:' + batteryLoading);
        }).catch(error => {
        this.log.error('Error Checking Battery currently loading not possible' + error);
        this.isBatteryLoadingFromNet = this.alphaService.isBatteryCurrentlyLoading();
        return;
      });


      if (this.tibber !== undefined){
        if (this.tibber.getIsTriggeredToday()===false && this.dailyLoadingFromNetReset === false ){
          this.log.debug('no loading possible today, stop eventually existing loading');
          this.alphaService.stopLoading(serialNumber);
          this.tibber.setIsTriggeredToday(undefined);
          this.dailyLoadingFromNetReset = true;
        }
      }
    }

    this.alphaService.getLastPowerData(serialNumber).then(
      detailData => {
        if (detailData!==null && detailData.data!==null){
          this.log.debug('SOC: ' + detailData.data.soc);
          this.setSocCurrent( detailData.data.soc);
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
              this.tibber.setIsTriggeredToday(undefined);
              this.dailyLoadingFromNetReset = false; // allow new daily loading reset
            }
            this.lastClearDate = now;
          }
        }
      },
    ).catch(error => {
      this.log.error('Getting Statistics Data from Alpha Ess failed ' + error);
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
    this.triggerTotal = this.triggerAlpha || this.triggerTibber;
    this.log.debug('Trigger: alpha ess: '+ this.triggerAlpha + ' tibber: ' + this.triggerTibber + ' total:'+this.triggerTotal);
    this.log.debug('Triggered GET ContactSensorState');
    this.pushMqtt(this.triggerTotal);
    return this.getContactSensorState(this.triggerTotal);
  }

  pushMqtt(triggerTotal: boolean){
    if (this.mqtt !== undefined) {
      this.mqtt.pushTriggerMessage(triggerTotal);
    }
  }

  getContactSensorState(triggerTotal : boolean) {
    if (this.hap !== undefined){
      if (triggerTotal === false){
        this.log.debug('trigger not fired -> status CONTACT_DETECTED');
        return this.hap.Characteristic.ContactSensorState.CONTACT_DETECTED;
      }
      this.log.debug('trigger fired -> status CONTACT_NOT_DETECTED');
      return this.hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    }
  }


  identify(): void {
    this.log.debug('Its me, Energy contact sensor trigger plugin');
  }


}
