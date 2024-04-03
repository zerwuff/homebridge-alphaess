import { API, PlatformConfig, Logging, StaticPlatformPlugin, AccessoryPlugin } from 'homebridge';
import { AlphaLightPlugin } from './AlphaLightPlugin';
import { AlphaHumidityPlugin } from './AlphaHumidityPlugin';

import { EnergyTriggerPlugin } from './EnergyTriggerPlugin';

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

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config;
    log.info('Alpha Ess Platform Plugin started ');
  }

  // Register 2 Alpha ESS Plugins
  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new AlphaLightPlugin(this.log, this.config, this.api),
      new AlphaHumidityPlugin(this.log, this.config, this.api),
      new EnergyTriggerPlugin(this.log, this.config, this.api),
    ]);
  }

}


