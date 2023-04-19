
import { Logging } from 'homebridge';
import crypto from 'crypto';
import { AlphaLoginResponse } from './response/AlphaLoginResponse';
import { AlphaDetailResponse } from './response/AlphaDetailResponse';
import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';
import { ObjectMapper } from 'jackson-js';
import { AlphaSettingsResponse } from './response/AlphaSettingsResponse';
const request = require('request');


const AUTHPREFIX = 'al8e4s';
const AUTHCONSTANT = 'LS885ZYDA95JVFQKUIUUUV7PQNODZRDZIS4ERREDS0EED8BCWSS';
const AUTHSUFFIX = 'ui893ed';

// see https://github.com/CharlesGillanders/alphaess
export const BASE_URL= 'https://cloud.alphaess.com/api';
export class AlphaService {
  private logger: Logging;
  private username;
  private password;
  private logRequestDetails: boolean;

  private baseUrl: string;

  constructor(logger: Logging | undefined, username: string | undefined, password: string, logRequestDetails: boolean, url: string ) {
    this.logger = logger;
    this.password = password;
    this.username = username;
    this.logRequestDetails = logRequestDetails;
    this.baseUrl = url;
  }


  async getDetailData(token, serialNumber): Promise<AlphaDetailResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/ESS/GetLastPowerDataBySN?noLoading=true&sys_sn=' + serialNumber;

    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', token, serialNumber);
    }

    const req = {
      method: 'GET',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'authtimestamp': authtimestamp,
        'authsignature': authsignature,
        'Authorization': 'Bearer ' + token,
      },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const detailResponse = new ObjectMapper().parse<AlphaDetailResponse>(JSON.stringify(body));
          return resolve(detailResponse);
        }
        return reject(body);
      },
      );
    });
  }
  //await client.setbatterycharge(serial, False, "00:00", "00:00", "00:00", "00:00", 100)
  //await client.setbatterydischarge(serial, True, "08:00", "23:00", "00:00", "00:00", 15)

  async setBatteryCharge(token:string, serialNumber:string, alphaSettingsData:Map<string, unknown> ): Promise<boolean>{
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/Account/CustomUseESSSetting';

    const grid_charge = 1; // 1... charge, 0..discharge
    const cp2start = '00:00';
    const cp2end = '00:00';
    /**
 * "grid_charge":1,
 "time_chaf1a":"19:00",
 "time_chae1a":"20:00",
 */
    alphaSettingsData['grid_charge'] = 1;
    alphaSettingsData['time_chaf1a'] = '22:00';
    alphaSettingsData['time_chae1a'] = '22:30';

    const req = {
      method: 'POST',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'authtimestamp': authtimestamp,
        'authsignature': authsignature,
        'Authorization': 'Bearer ' + token,
      },
      body: alphaSettingsData,

    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          console.log('ok ' + response);
          return resolve(true);
        }
        console.log('failed: ' + response);
        return reject(false);
      },
      );
    });
  }


  async getSettingsData(token:string, serialNumber:string): Promise<AlphaSettingsResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/Account/GetCustomUseESSSetting';

    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', token, serialNumber);
    }

    const req = {
      method: 'GET',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'authtimestamp': authtimestamp,
        'authsignature': authsignature,
        'Authorization': 'Bearer ' + token,
      },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const response = new ObjectMapper().parse<AlphaSettingsResponse>(JSON.stringify(body));
          return resolve(response);
        }
        return reject(body);
      },
      );
    });
  }

  async getStatisticsData(token:string, serialNumber:string): Promise<AlphaStatisticsByDayResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/Power/SticsByDay';

    const dateString = new Date().toDateString();

    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', token, serialNumber);
    }

    const req = {
      method: 'POST',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'authtimestamp': authtimestamp,
        'authsignature': authsignature,
        'Authorization': 'Bearer ' + token,
      },
      body:
      {
        sn: serialNumber,
        szDay: dateString,
      },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const response = new ObjectMapper().parse<AlphaStatisticsByDayResponse>(JSON.stringify(body));
          return resolve(response);
        }
        return reject(body);
      },
      );
    });
  }

  async login(): Promise<AlphaLoginResponse> {
    const authtimestamp = Math.round(new Date().getTime() / 1000).toString();
    const authsignature = this.getSignature(authtimestamp);
    const url = this.baseUrl + '/Account/Login';
    if (this.logRequestDetails) {
      this.logRequestData(authsignature, authtimestamp, url, '', '', '');
    }

    const req = {
      method: 'POST',
      url: url,
      json: true,
      gzip: false,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'authtimestamp': authtimestamp,
        'authsignature': authsignature,
      },
      body:
            {
              username: this.username,
              password: this.password,
            },
    };

    return new Promise((resolve, reject) => {
      request(req, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const loginResponse = new ObjectMapper().parse<AlphaLoginResponse>(JSON.stringify(body));
          return resolve(loginResponse);
        }
        return reject(body);
      },
      );
    });
  }


  getTotalPower(detailData: AlphaDetailResponse){
    const stringPowerTotal = detailData.data.ppv1 + detailData.data.ppv2 +
    detailData.data.ppv3 + detailData.data.ppv4 +
    detailData.data.pmeter_dc;
    return stringPowerTotal;
  }

  // calculate the trigger depending on power and socLoading
  isTriggered(detailData:AlphaDetailResponse, powerLoadingThreshold:number, socLoadingThreshold: number): boolean {
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
      this.logMsg('Battery SOC:' + soc + ' is over threshold:' +socLoadingThreshold + 'soc trigger:true ');
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
    const gen_hash = crypto.createHash('sha512').update(AUTHCONSTANT + authtimestamp).digest('hex');
    return AUTHPREFIX + gen_hash + AUTHSUFFIX;
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