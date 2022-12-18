import { API } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, ACCESSORY_NAME } from './settings';
import { ExampleHomebridgePlatform } from './platform';
import { AlphaService } from './AlphaService';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  
  api.registerPlatform(PLATFORM_NAME, ExampleHomebridgePlatform);

        
  api.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, AlphaService);

};
