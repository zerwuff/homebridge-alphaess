
import { Logger } from 'homebridge';
import crypto from "crypto";
import { JsonUtil } from '../util/JsonUtil';
import { AlphaLoginResponse } from './response/AlphaLoginResponse';
import { AlphaDetailRespose } from './response/AlphaDetailResponse';
import { triggerAsyncId } from 'async_hooks';
const request = require('request');


const AUTHPREFIX = "al8e4s"
const AUTHCONSTANT = "LS885ZYDA95JVFQKUIUUUV7PQNODZRDZIS4ERREDS0EED8BCWSS"
const AUTHSUFFIX = "ui893ed"
const BASEURL = "https://cloud.alphaess.com/api"


export class AlphaService {
    private logger: Logger;
    private username;
    private password;
    private logRequestDetails: boolean;

    constructor(logger: Logger | undefined, username: String | undefined, password: String, logRequestDetails: boolean) {
        this.logger = logger;
        this.password = password;
        this.username = username;
        this.logRequestDetails = logRequestDetails;
    }

  
    async getDetailData(token, serialNumber): Promise<AlphaDetailRespose> {
        const authtimestamp = new String( Math.round(new Date().getTime() / 1000));
        const authsignature =  this.createSignature(authtimestamp);
        const url = BASEURL + '/ESS/GetLastPowerDataBySN?noLoading=true&sys_sn=' + serialNumber;

        if (this.logRequestDetails) {
            this.logRequestData(authsignature, authtimestamp, url, "", token, serialNumber);
        }

        var req = {
            method: "GET",
            url: url,
            json: true,
            gzip: false,
            headers: {
                "Content-Type": "application/json",
                "Connection": "keep-alive",
                "authtimestamp": authtimestamp,
                "authsignature": authsignature,
                "Authorization": "Bearer " + token
            }
        };

        return new Promise((resolve, reject) => {
            request(req, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const detailResponse = JsonUtil.deserialize(JSON.parse(JSON.stringify(body)), AlphaDetailRespose);
                    return resolve(detailResponse);
                }
                return reject(body);
            }
            );
        });
    }


    async login(): Promise<AlphaLoginResponse> {
        const authtimestamp =  new String( Math.round(new Date().getTime() / 1000));
        const authsignature =  this.createSignature(authtimestamp);
        const url = BASEURL + '/Account/Login';
        if (this.logRequestDetails) {
            this.logRequestData(authsignature, authtimestamp, url, "", "", "")
        }

        var req = {
            method: "POST",
            url: url,
            json: true,
            gzip: false,
            headers: {
                "Content-Type": "application/json",
                "Connection": "keep-alive",
                "authtimestamp": authtimestamp,
                "authsignature": authsignature,
            },
            body:
            {
                username: this.username,
                password: this.password
            }
        };

        return new Promise((resolve, reject) => {
            request(req, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const loginResponse = JsonUtil.deserialize(JSON.parse(JSON.stringify(body)), AlphaLoginResponse);
                    return resolve(loginResponse);
                }
                return reject(body);
            }
            );
        });
    }


    
    // calculate the trigger depending on power and socLoading
    calculateTrigger(detailData:AlphaDetailRespose, powerLoadingThreshold:number , socLoadingThreshold: number): boolean
    {
        this.logMsg('Calculating trigger for respone:' + detailData + ' powerLoadingThreshold: ' + powerLoadingThreshold + ' socLoadingThreshold:' +socLoadingThreshold + ' trigger:'+ trigger);

        var trigger:boolean = false;
        var soc = detailData.data.soc;
         // power to the network: negative -> producing, positive -> consuming  
        var pMeterTotal = (detailData.data.pmeter_l1 + detailData.data.pmeter_l2 + detailData.data.pmeter_l3) * -1 ;

        var pvTrigger = false;
        var socTrigger = false;

        this.logMsg('pmeterTotal :' +pMeterTotal + ' soc: ' + soc);

        if (pMeterTotal >= powerLoadingThreshold){
            this.logMsg('Power total back into the net:' + pMeterTotal + ' is over threshold:' + powerLoadingThreshold + ' lets put that into the car');
            pvTrigger  = true;
        }
        if (soc >= socLoadingThreshold){
            this.logMsg('Battery SOC:' + soc + ' is over threshold:' +socLoadingThreshold + ' we can charge the car');
            socTrigger  = true;
        }
        
        if (socTrigger==true && pvTrigger==true){
            trigger = true ;
        }

        this.logMsg('Calculating trigger ->  powerLoadingThreshold: ' + powerLoadingThreshold + ' socLoadingThreshold:' +socLoadingThreshold + ' resulting in trigger:'+ trigger);

        return trigger;
    }

    createSignature(authtimestamp){
        var hash = crypto.createHash('sha512');
        var gen_hash = crypto.createHash('sha512').update(AUTHCONSTANT + authtimestamp).digest("hex")
        return AUTHPREFIX + gen_hash + AUTHSUFFIX;
    }
  
    logRequestData(authsignature: string, authtimestamp: String, url: string, data: string, token: string, serialNumber) {
        this.logMsg('Log Request data for url ' + url);
        this.logMsg('authtimestamp     ' + authtimestamp);
        this.logMsg('data' + data);
        this.logMsg('authsignature:' + authsignature);
        this.logMsg('token:' + token);
        this.logMsg('serialNumber:' + serialNumber);
        this.logMsg('###################')
    }      

    private logMsg(message) {
        if (this.logger != undefined) {
            this.logger.debug(message);
        } else {
            console.log(message);
        }
    }
};