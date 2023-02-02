
import { timeStamp } from 'console';
import { HAP, API,  AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, Characteristic, BridgeConfiguration } from 'homebridge';
import { AlphaService } from "./alpha/AlphaService.js"
import { connect } from 'mqtt'
export class AlphaTriggerPlugin implements AccessoryPlugin {

  private alphaService: AlphaService;
  private informationService: Service;
  private service: Service;
  private contactSensorService: Service;

  private hap: HAP;
  private log: Logging;
  private config: PlatformConfig;
  private name: string;

  private refreshTimerInterval: number; // timer milliseconds to check timer 

  // alpha ess status variables 
  private batteryLevel: number;
  private batteryPower: number;

  // threshold for triggering the loading trigger
  private powerLoadingThreshold: number; // minimum power to load 
  private socLoadingThreshold: number; // minimum soc to load 

  // true / false trigger 
  private trigger: boolean;

  // mqtt connection
  private mqtt_url: string ;
  private mqtt_trigger_topic_true: string;
  private mqtt_trigger_topic_false: string;
  
  private mqtt_trigger_message_true: string;
  private mqtt_trigger_message_false: string;
  
  constructor (log: Logging, config: PlatformConfig, api: API) {
    this.hap = api.hap;
    this.log = log;
    this.batteryLevel = 0;
    this.refreshTimerInterval = 10000;
    this.config = config;
    this.name= "AlphaEssTrigger";
    log.debug('Alpha ESS Trigger plugin loaded');

    this.informationService = new this.hap.Service.AccessoryInformation()
      .setCharacteristic(this.hap.Characteristic.Manufacturer, "Alpha Ess Homebridge Plugin by Jens Zeidler")
      .setCharacteristic(this.hap.Characteristic.SerialNumber, config.serialnumber)
      .setCharacteristic(this.hap.Characteristic.Model, "Alpha ESS Trigger Plugin");
    
    this.service = new this.hap.Service.ContactSensor(config.name)

    this.service.getCharacteristic(this.hap.Characteristic.ContactSensorState)
      .onGet(this.handleContactSensorStateGet.bind(this));

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
          }, this.refreshTimerInterval);
    }

    if (this.config.mqtt_url===undefined ){
      this.log.error("mqtt_url is not set, not pushing anywhere")
    }
    else{
      this.mqtt_url = this.config.mqtt_url;
      this.mqtt_trigger_topic_true = this.config.mqtt_trigger_topic_true;
      this.mqtt_trigger_topic_false= this.config.mqtt_trigger_topic_false;
      this.mqtt_trigger_message_true = this.config.mqtt_trigger_message_true;
      this.mqtt_trigger_message_false = this.config.mqtt_trigger_message_false;  
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

            this.handleContactSensorStateGet();
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
    this.pushToExchange(this.trigger);

    if (this.trigger == false){
      this.log.debug('trigger not fired -> status CONTACT_DETECTED');
      return this.hap.Characteristic.ContactSensorState.CONTACT_DETECTED;
    }
    this.log.debug('trigger fired -> status CONTACT_NOT_DETECTED');
    return this.hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }

  async pushToExchange(trigger: boolean){
    this.log.debug("trying to connect to mqtt"); 
        
    var client = connect(this.mqtt_url,{clientId:this.name}); 
    
      client.on("connect",function(this : AlphaTriggerPlugin){	
      
        if (trigger==true){
          this.log.debug("send trigger value true :"+ this.mqtt_trigger_message_true + ' to: ' + this.mqtt_trigger_topic_true); 
          client.publish(this.mqtt_trigger_topic_true, this.mqtt_trigger_message_true)
        }else{
          this.log.debug("send trigger value false :"+ this.mqtt_trigger_message_false + ' to: ' + this.mqtt_trigger_topic_false); 
          client.publish(this.mqtt_trigger_topic_false, this.mqtt_trigger_message_false)
        }
        
      });
  }
  send(trigger:boolean){

  }
  identify(): void {
    this.log.debug('Its me, Alpha cloud contact sensor trigger plugin');
  }


}
