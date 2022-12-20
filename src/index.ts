import { API } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, ACCESSORY_NAME } from './settings';
import { AlphaPlugin } from './AlphaPlugin';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {

        api.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, AlphaPlugin);

};
