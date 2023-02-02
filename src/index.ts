import { API, HAP, PlatformConfig, Logging, StaticPlatformPlugin, AccessoryPlugin  } from 'homebridge';

import { AlphaPlugin } from './AlphaPlugin';
import { AlphaTriggerPlugin } from './AlphaTriggerPlugin';

const PLATFORM_NAME = "AlphaEssPlatform";


let hap: HAP;

export = (api: API) => {
        hap = api.hap;
      
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
          // probably parse config or something here
      
          log.info("Alpha Ess Platform Plugin started ");
        }
      
        /*
         * This method is called to retrieve all accessories exposed by the platform.
         * The Platform can delay the response my invoking the callback at a later time,
         * it will delay the bridge startup though, so keep it to a minimum.
         * The set of exposed accessories CANNOT change over the lifetime of the plugin!
         */
        accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
          callback([
            new AlphaPlugin(this.log, this.config, this.api),
            new AlphaTriggerPlugin(this.log, this.config, this.api),
          ]);
        }
      
      }