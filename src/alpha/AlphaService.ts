
import { API, AccessoryConfig, AccessoryPlugin, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { off } from 'process';
import { json } from 'stream/consumers';
import { AlphaDetailRespose } from './response/AlphaDetailResponse';
import  fetch  from "node-fetch";
import  crypto from "crypto";

const AUTHPREFIX = "al8e4s"
const AUTHCONSTANT = "LS885ZYDA95JVFQKUIUUUV7PQNODZRDZIS4ERREDS0EED8BCWSS"
const AUTHSUFFIX = "ui893ed"
const BASEURL = "https://cloud.alphaess.com/api"    

export class AlphaService{
    private logger: Logger; 
    private username;
    private password;
    private logRequestDetails : boolean;
    
    constructor(logger: Logger | undefined, username: String | undefined, password: String, logRequestDetails: boolean ) {
        this.logger = logger;
        this.password = password;
        this.username = username;
        this.logRequestDetails = logRequestDetails;       
    }

    async getDetailData(token,serialNumber): Promise<AlphaDetailRespose> {
        const authtimestamp = "" + Math.round(new Date().getTime() / 1000); 
        var hash = crypto.createHash('sha512');
        var data = hash.update(AUTHCONSTANT + authtimestamp, 'ascii');
        //Creating the hash in the required format
        var gen_hash = crypto.createHash('sha512').update(AUTHCONSTANT + authtimestamp).digest("hex")
        const authsignature = AUTHPREFIX + gen_hash + AUTHSUFFIX;
        const url = BASEURL+'/ESS/GetLastPowerDataBySN?noLoading=true&sys_sn=' + serialNumber;

        if (this.logRequestDetails){
            this.logRequestData(authsignature, authtimestamp, gen_hash, url, "", token, serialNumber);
        }
        
        const response = await fetch(url, {
          method: 'get',
          headers: {"Content-Type": "application/json" , 
                      "Connection": "keep-alive",
                      "Accept": "*/*",
                      "Accept-Encoding": "gzip, deflate",
                      "authtimestamp": authtimestamp, 
                      "authsignature" :authsignature, 
                      "Authorization": "Bearer " + token
                    },
          })

          let jsonResponse = await response.text();
          if (jsonResponse!=null){
            
            this.logMsg(await jsonResponse);
            var obj: AlphaDetailRespose = this.deserialize(JSON.parse(jsonResponse), AlphaDetailRespose);

           return obj;
        }
       }

       async login() : Promise<String> {
        
        const authtimestamp = "" + Math.round(new Date().getTime() / 1000) ; //;Date.now().toString();
        var hash = crypto.createHash('sha512');
        var data = hash.update(AUTHCONSTANT + authtimestamp, 'ascii');
        //Creating the hash in the required format
        var gen_hash = crypto.createHash('sha512').update(AUTHCONSTANT + authtimestamp).digest("hex")
        const authsignature = AUTHPREFIX + gen_hash + AUTHSUFFIX;
        const url = BASEURL+'/Account/Login';
        if (this.logRequestDetails){
            this.logRequestData(authsignature, authtimestamp,gen_hash,url,"","","")
        }
    
        const response = await fetch(url, {
                        method: 'post',
                        body: JSON.stringify({ username: this.username, password: this.password }),
                        headers: {"Content-Type": "application/json" , 
                                  "Connection": "keep-alive",
                                  "Accept": "*/*",
                                  "Accept-Encoding": "gzip, deflate",
                                  "authtimestamp": authtimestamp, 
                                  "authsignature" :authsignature 
                                },
                  }) 

        let jsonResponse = await response.json();
        if (jsonResponse!=null){                
            return jsonResponse.data.AccessToken;
        }
        
        return undefined;
    }
  
    deserialize<T>(jsonObject: any, Constructor: { new (): T }): T {
        if (!Constructor || !Constructor.prototype.__propertyTypes__ || !jsonObject || typeof jsonObject !== "object") {
            // No root-type with usable type-information is available.
            return jsonObject;
        }
    
        // Create an instance of root-type.
        var instance: any = new Constructor();
    
        // For each property marked with @JsonMember, do...
        Object.keys(Constructor.prototype.__propertyTypes__).forEach(propertyKey => {
            var PropertyType = Constructor.prototype.__propertyTypes__[propertyKey];
    
            // Deserialize recursively, treat property type as root-type.
            instance[propertyKey] = this.deserialize(jsonObject[propertyKey], PropertyType);
        });
    
        return instance;
    }

    logRequestData(authsignature: string, authtimestamp: string, gen_hash: string, url: string, data: string, token: string, serialNumber) {
        this.logMsg('authtimestamp     ' + authtimestamp);
        this.logMsg('gen_hash     ' + gen_hash);    
        this.logMsg('url ' + url);
        this.logMsg('data' + data);
        this.logMsg('authsignature:' + authsignature);
        this.logMsg('token:' + token);
        this.logMsg('serialNumber:' + serialNumber);
    }
    

    private logMsg(message){
        if (this.logger != undefined){
            this.logger.debug(message);
        }else {
            console.log(message);
        }
    }
};