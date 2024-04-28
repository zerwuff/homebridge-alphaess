import { Logging } from 'homebridge';
import { connect } from 'mqtt';
import { ObjectMapper } from 'jackson-js';
import { AlphaMessage, AlphaStatus } from './msg/AlphaMessage';


export class MqttTopics {

  // trigger topics
  mqtt_trigger_topic_true: string;
  mqtt_trigger_topic_false: string;

  mqtt_trigger_message_true: string;
  mqtt_trigger_message_false: string;

  // status topic
  mqtt_status_topic: string;
}

export class AlphaMqttService {
  log: Logging;
  // mqtt connection
  private name = 'alpha mqtt service';
  private mqtt_url: string ;

  // mqtt connection
  private topics: MqttTopics ;

  constructor(log:Logging, mqtt_url:string, topics: MqttTopics ){
    this.log = log;
    this.mqtt_url = mqtt_url;
    this.topics = topics;
  }

  async pushStatusMsg(totalPower: number, soc: number){
    this.log.debug('trying to connect to mqtt to sent power status message ');
    const client = connect(this.mqtt_url, {clientId:this.name});
    const topic = this.topics.mqtt_status_topic;
    client.on('connect', ()=> {
      const time = new Date().toISOString();
      const timeStr = time.substring(0, time.length-1);

      const as= new AlphaStatus();
      as.soc = soc;
      as.totalPower = totalPower;

      const alphaMsg = new AlphaMessage();
      alphaMsg.Time = timeStr;
      alphaMsg.ALPHA = as;
      const alphaMsgString = new ObjectMapper().stringify<AlphaMessage>(alphaMsg);
      client.publish(topic, alphaMsgString, { qos: 0, retain: false });
      this.log.debug('sent power data object' + alphaMsgString);
      client.end();
    });
  }

  async pushTriggerMessage(trigger: boolean){
    this.log.debug('trying to connect to mqtt to send trigger message');
    const client = connect(this.mqtt_url, {clientId:this.name});

    client.on('connect', ()=> {
      this.log.debug('connected to mqtt');
      this.log.debug('trigger value: ' + trigger);
      if (trigger===false){
        this.log.debug('sending message trigger false: ' + this.topics.mqtt_trigger_message_false + ' on topic: ' + this.topics.mqtt_trigger_topic_false);
        client.publish(this.topics.mqtt_trigger_topic_false, this.topics.mqtt_trigger_message_false);
        client.end();
        return;
      } else {
        this.log.debug('sending message trigger true: ' + this.topics.mqtt_trigger_message_true + ' on topic: ' + this.topics.mqtt_trigger_topic_true);
        client.publish(this.topics.mqtt_trigger_topic_true, this.topics.mqtt_trigger_message_true);
        client.end();
        return;
      }
    });
  }


}