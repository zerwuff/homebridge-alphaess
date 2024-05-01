import { API, PlatformConfig, Logging, StaticPlatformPlugin, AccessoryPlugin } from 'homebridge';
import { AlphaLightPlugin } from './AlphaLightPlugin';
import { AlphaHumidityPlugin } from './AlphaHumidityPlugin';

import { EnergyTriggerPlugin } from './EnergyTriggerPlugin';
import { AlphaService } from './alpha/AlphaService';
import { AlphaLoadPlugin } from './AlphaLoadPlugin';

const PLATFORM_NAME = 'AlphaEssPlatform';

/**
 *
 * @param api
 * export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, AlphaEssPlatformPlugin);

};

 */
const fun = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, AlphaEssPlatformPlugin);
};
export default fun;

export { AlphaLightPlugin } from './AlphaLightPlugin';
export { AlphaService } from './alpha/AlphaService';
export { AlphaMqttService, MqttTopics } from './alpha/mqtt/AlphaMqttService';
export { AlphaTrigger } from './interfaces';
export { EnergyTriggerPlugin } from './EnergyTriggerPlugin';
export { TibberService } from './tibber/TibberService';
export { ImageRenderingService } from './alpha/ImageRenderingService';

export { Utils } from './util/Utils';

class AlphaEssPlatformPlugin implements StaticPlatformPlugin {

  private readonly log: Logging;

  private readonly config: PlatformConfig;

  private readonly api: API ;

  private serialNumber: string;

  private power_image_filename: string ;

  private alphaService: AlphaService;

  private refreshTimerInterval: number;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config;
    log.info('Alpha Ess Platform Plugin started ');

    this.serialNumber = config.serialnumber;
    this.power_image_filename = config.power_image_filename;

    if (!config.serialnumber || !config.appid || !config.appsecret) {
      this.log.error('Configuration was missing: either appid or appsecret not present');
    }

    if (!config.refreshTimerInterval ) {
      this.log.error('refreshTimerInterval is not set, not refreshing trigger data ');
    } else {
      this.refreshTimerInterval = config.refreshTimerInterval + Math.floor(Math.random() * 10000) ;
      this.alphaService = new AlphaService(this.log, config.appid, config.appsecret, config.logrequestdata, config.alphaUrl,
        this.refreshTimerInterval, this.serialNumber);
    }
  }

  // Register 2 Alpha ESS Plugins
  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new AlphaLightPlugin(this.log, this.config, this.api, this.alphaService),
      new AlphaHumidityPlugin(this.log, this.config, this.api, this.alphaService),
      new EnergyTriggerPlugin(this.log, this.config, this.api, this.alphaService),
      new AlphaLoadPlugin(this.log, this.config, this.api, this.alphaService),

    ]);
  }

}


