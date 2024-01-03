
import { Logging } from 'homebridge';
import crypto from 'crypto';
import { AlphaLastPowerDataResponse } from './response/AlphaLastPowerDataResponse';
import { ObjectMapper } from 'jackson-js';
import { AlphaSettingsResponse } from './response/AlphaSettingsResponse';
import { AlphaData } from '../interfaces';
import { Utils } from '../util/Utils';

const request = require('request');

// see https://github.com/CharlesGillanders/alphaess

export class AlphaService {
  private logger: Logging;
  private appid:string;
  private appsecret:string;
  private logRequestDetails: boolean;
  private baseUrl: string;
  private lastLoadingStart:Date;
  private dailyMap: Map<number, AlphaData>;
  private utils: Utils;
  private lastClearDate: Date ;

  constructor(logger: Logging | undefined, appid: string | undefined, appsecret: string, logRequestDetails: boolean, url: string ) {
    this.logger = logger;
    this.appid = appid;
    this.appsecret = appsecret;
    this.logRequestDetails = logRequestDetails;
    this.baseUrl = url;
    this.lastLoadingStart = undefined;
    this.dailyMap = new Map();
    this.utils = new Utils();
    this.lastClearDate = new Date();
    this.lastClearDate.setHours(0);
    this.lastClearDate.setMinutes(0);
    this.lastClearDate.setMinutes(1);
    this.clearHistoricData();
  }


  setLastLoadingStart(loadStart:Date ){
    this.lastLoadingStart = loadStart ;
  }


  // check if current loading of battery makes sense, and if so trigger it
  async checkAndEnableReloading(serialNumber:string, priceIsLow : boolean, numberOfMinutes:number,
    socBattery:number, socLowerThreshold:number):
    Promise <Map<string, unknown>> {

    const updateSettingsData = this.calculateUpdatedSettingsData(priceIsLow,
      numberOfMinutes, socBattery, socLowerThreshold);

    // update settings needed
    if (updateSettingsData!==undefined){
      // update required, either load or unload battery
      await this.setAlphaSettings(serialNumber, updateSettingsData).catch(() => {
        if (updateSettingsData['gridCharge'] === 1){ // try to load
          this.setLastLoadingStart(undefined); // mark as not loading, try again later
          throw new Error('could not set update battery loading ');
        }

        if (updateSettingsData['gridCharge'] === 0){ // try to unload
          this.setLastLoadingStart(undefined); // mark as not loading
          throw new Error('could not set update battery loading ');
        }
      });
      return updateSettingsData;
    }

    return undefined;
  }


  // calculate loading settings: if currently loading, continue, else disable loading trigger
  isBatteryCurrentlyLoading(): boolean {


    if (this.lastLoadingStart!==undefined) {
      return new Date() > this.lastLoadingStart;
    }
    return false ;
  }

  // calculate loading settings: if currently loading, continue, else disable loading trigger
  calculateUpdatedSettingsData(priceIsLow : boolean, loadingMinutes:number,
    socBattery:number, socLowerThreshold:number):
     Map<string, unknown> {
    const newSettingsData = new Map<string, unknown> ();
    const batteryLow = socBattery <= socLowerThreshold ;


    // add loading minutes to planned end time
    let timeToStartLoading = false;
    let loadingShallEndByTime = false;
    const isCurrentlyLoading = this.lastLoadingStart !== undefined ;

    if (this.lastLoadingStart!==undefined){ // loadins started, check if we need to stop it
      const lastLoadingStartMillis = this.lastLoadingStart.getTime();
      const minLoadingMillis = loadingMinutes * 1000 * 60;
      loadingShallEndByTime = new Date().getTime() > (lastLoadingStartMillis + minLoadingMillis);
      this.logMsg('lastLoadingStartMillis: ' + lastLoadingStartMillis + ' minLoadingMillis:' + minLoadingMillis + ' loadingShallEndByTime: ' + loadingShallEndByTime);
    } else {
      timeToStartLoading = true;
      this.logMsg('timeToStartLoading: ' + timeToStartLoading);
    }
    this.logMsg('calculate new loading isCurrentlyLoading: ' + isCurrentlyLoading );

    //shall load initially
    if (batteryLow && priceIsLow && timeToStartLoading ){
      const newSettingsData = new Map<string, unknown> ();

      if (!isCurrentlyLoading){
        this.lastLoadingStart = new Date();
        this.logMsg('lets put some energy in this place for minutes: ' + loadingMinutes);
        const now = new Date();
        const newEndDate = new Date();
        newEndDate.setMinutes(now.getMinutes() + loadingMinutes);

        newSettingsData['gridCharge'] = 1;
        newSettingsData['batHighCap'] = 95;
        newSettingsData['timeChaf1'] = this.getLoadingHourString(now.getHours(), now.getMinutes());
        newSettingsData['timeChae1'] = this.getLoadingHourString(newEndDate.getHours(), newEndDate.getMinutes());
        newSettingsData['timeChaf2'] = '00:00';
        newSettingsData['timeChae2'] = '00:00';
        this.logMsg('currently not loading detected, enable it via api ');
        return newSettingsData;
      }
    }

    // disable loading after time is up or price goes up
    if (loadingShallEndByTime ){
      this.lastLoadingStart = undefined;
      this.logMsg('loading shall stop now, disable it now');
      // disable loading, set default time values
      newSettingsData['gridCharge'] = 0;
      newSettingsData['timeChaf1'] = '00:00';
      newSettingsData['timeChae1'] = '00:00';
      newSettingsData['timeChaf2'] = '00:00';
      newSettingsData['timeChae2'] = '00:00';
      return newSettingsData;
    }
    return undefined;
  }


  // next quarter loading time
  getLoadingHourString(hour:number, minute:number ): string {
    let minuteString = ':15';
    let hourString = new String(hour);

    if (minute> 15){
      minuteString = ':30';
    }
    if (minute> 30){
      minuteString = ':45';
    }
    if (minute>=45){
      minuteString = ':00';
      hour = hour + 1;
      hourString = new String(hour);
      if (hour >=24 ){
        hour = 0;
        hourString = '00';
      }

    }
    if (hour < 10){
      hourString = '0' + hour;
    }
    return hourString + minuteString;
  }

  async setAlphaSettings(serialNumber:string, alphaSettingsData:Map<string, unknown> ): Promise<boolean>{
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    let timeChae1 = alphaSettingsData['timeChae1'];
    let timeChae2 = alphaSettingsData['timeChae2'];
    let timeChaf1 = alphaSettingsData['timeChaf1'];
    let timeChaf2 = alphaSettingsData['timeChaf2'];
    alphaSettingsData['sysSn'] = serialNumber;

    if (timeChaf2===undefined){
      timeChaf2='00:00';
      alphaSettingsData['timeChaf2'] = timeChaf2;
    }
    if (timeChaf1===undefined){
      timeChaf1='00:00';
      alphaSettingsData['timeChaf1'] = timeChaf1;
    }
    if (timeChae1===undefined){
      timeChae1='00:00';
      alphaSettingsData['timeChae1'] = timeChae1;
    }
    if (timeChae2===undefined){
      alphaSettingsData['timeChae2'] = timeChae2;
      timeChae2='00:00';
    }

    const urlPart = '/updateChargeConfigInfo';
    const url = this.baseUrl + urlPart;
    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', '', serialNumber);
    }

    const req = {
      method: 'POST',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'appId': this.appid,
        'timeStamp': authtimestamp,
        'sign': authsignature,
      },
      body: alphaSettingsData,
    };

    if (this.logRequestDetails) {
      this.logMsg('Set battery loading data: ' +JSON.stringify(req));
    }

    return new Promise((resolve, reject) => {
      request(req, (error, response, body ) => {
        if (!error && (response.statusCode === 200 || response.code === 201) ) {
          const response = new ObjectMapper().parse<AlphaSettingsResponse>(JSON.stringify(body));
          if (response.data === undefined || response.data === null || ( response.code !== 200 && response.code !==201) ) {
            console.error(response);
            this.logMsg('could not start loading the battery : ' + response.code + ' -> ' + response.msg);
            return reject(body);
          }
          return resolve(true);

        } else {
          this.logMsg('could not start loading the battery because of error or wrong response code : ' + error);
          return reject(false);
        }
      },
      );
    });
  }


  async getSettingsData(serialNumber:string): Promise<AlphaSettingsResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/getChargeConfigInfo?sysSn='+serialNumber;

    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', '', serialNumber);
    }

    const req = {
      method: 'GET',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'appId': this.appid,
        'timeStamp': authtimestamp,
        'sign': authsignature,
      },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const response = new ObjectMapper().parse<AlphaSettingsResponse>(JSON.stringify(body));
          if (response.data === undefined || response.code !== 200 ){
            return reject(body);
          }
          this.logMsg('Get Settings Response:' + JSON.stringify(body));
          return resolve(response);
        }
        return reject(body);
      },
      );
    });
  }

  async getLastPowerData(serialNumber): Promise<AlphaLastPowerDataResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/getLastPowerData?sysSn=' + serialNumber;

    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', '', serialNumber);
    }

    const req = {
      method: 'GET',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'appId': this.appid,
        'timeStamp': authtimestamp,
        'sign': authsignature,
      },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const detailResponse = new ObjectMapper().parse<AlphaLastPowerDataResponse>(JSON.stringify(body));

          this.storeData(detailResponse);

          return resolve(detailResponse);
        }
        return reject(body);
      },
      );
    });
  }

  storeData(resp:AlphaLastPowerDataResponse){
    const now = new Date();
    const hours = now.getHours();
    const min = now.getMinutes();
    const index = hours * 4 + Math.round(min/15);
    this.dailyMap.set(index, new AlphaData(resp.data.soc, resp.data.ppv, ''+ index));

    if (this.utils.isNewDate(now, this.lastClearDate)){
      // day switch, empty cache
      this.clearHistoricData();
      this.lastClearDate = new Date();
    }
  }

  clearHistoricData(){
    this.dailyMap.clear();
    let clearIndex = 0;
    while (clearIndex < 96 ) { // 15 min intervall
      this.dailyMap.set(clearIndex, new AlphaData(0, 0, ''+ clearIndex) ) ;
      clearIndex++ ;
    }
  }

  getDailyMap() : Map<number, AlphaData>{
    return this.dailyMap;
  }

  getTotalPower(detailData: AlphaLastPowerDataResponse){
    return detailData.data.ppv;
  }

  // calculate the trigger depending on power and socLoading
  isTriggered(detailData:AlphaLastPowerDataResponse, powerLoadingThreshold:number, socLoadingThreshold: number): boolean {
    let trigger = false;
    const soc = detailData.data.soc;
    // power of all strings plus dc power = total energy from the sun into the system
    const stringPowerTotal = this.getTotalPower(detailData);

    let pvTrigger = false;
    let socTrigger = false;
    this.logMsg('soc: ' + soc );
    this.logMsg('pBatt :' + detailData.data.pbat);
    this.logMsg('stringPowerTotal :' +stringPowerTotal );

    if (stringPowerTotal > powerLoadingThreshold){
      this.logMsg('Power total on the strings :' + stringPowerTotal + ' is over threshold:' +
                powerLoadingThreshold + ' power trigger: true');
      pvTrigger = true;
    }
    if (soc >= socLoadingThreshold){
      this.logMsg('Battery SOC:' + soc + ' is over threshold:' +socLoadingThreshold + ' soc trigger:true ');
      socTrigger = true;
    }

    if (socTrigger===true && pvTrigger===true){
      trigger = true ;
    }

    this.logMsg('Calculating trigger ->  powerLoadingThreshold: ' + powerLoadingThreshold + ' socLoadingThreshold:' +
                socLoadingThreshold + ' resulting in trigger:'+ trigger);

    return trigger;
  }

  private getSignature(authtimestamp):string {
    const gen_hash = crypto.createHash('sha512').update(this.appid + this.appsecret + authtimestamp).digest('hex');
    return gen_hash;
  }

  logRequestData(authsignature: string, authtimestamp: string, url: string, data: string, token: string, serialNumber) {
    this.logMsg('Log Request data for url ' + url);
    this.logMsg('authtimestamp     ' + authtimestamp);
    this.logMsg('data' + data);
    this.logMsg('authsignature:' + authsignature);
    this.logMsg('token:' + token);
    this.logMsg('serialNumber:' + serialNumber);
    this.logMsg('###################');
  }

  private logMsg(message) {
    if (this.logger !== undefined) {
      this.logger.debug(message);
    } else {
      console.log('%s', message);
    }
  }
}