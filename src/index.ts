import { API, PlatformConfig, Logging, StaticPlatformPlugin, AccessoryPlugin } from 'homebridge';
import { AlphaPlugin } from './AlphaPlugin';
import { AlphaTriggerPlugin } from './AlphaTriggerPlugin';

const PLATFORM_NAME = 'AlphaEssPlatform';


export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, AlphaEssPlatformPlugin);

};

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
      new AlphaPlugin(this.log, this.config, this.api),
      new AlphaTriggerPlugin(this.log, this.config, this.api),
    ]);
  }

}