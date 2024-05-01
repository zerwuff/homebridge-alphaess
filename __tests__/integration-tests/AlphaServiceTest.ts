import 'jest';
import { MockServer } from 'jest-mock-server';

import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaData } from '../../src/interfaces';
import { AlphaLastPowerDataResponse, AlphaDataResponse,
  AlphaLastPowerDataResponseWithNullTestingOnly } from '../../src/alpha/response/AlphaLastPowerDataResponse';
import { ImageRenderingService } from '../../src/alpha/ImageRenderingService';
import { AlphaSettingsResponse } from '../../src/alpha/response/AlphaSettingsResponse';

const serialNumber ='blafasel';
const appid = 'bla';
const secret = 'AE1234';
const logRequestData = false;

describe('Integration Test with Mock Server', () => {

  const server = new MockServer();

  afterAll(() => server.stop());

  beforeAll(() => server.start());

  beforeEach(() => server.reset());


  it('Test Get Alpha Data ', async () => {
    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const lastPowerRoute = server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      const alphaData = new AlphaDataResponse();
      alphaData.ppv = 90;
      alphaData.pbat = 120;
      alphaData.pload = 12;
      alphaData.soc = 44;
      const detailResponse = new AlphaLastPowerDataResponse();
      detailResponse.data = alphaData;
      ctx.response.body = JSON.stringify(detailResponse);
      ctx.status = 200;
    });

    const alphaService = new AlphaService(undefined, 'goodAppId', secret, logRequestData, mockServerUrl, 1000, 'serialNumber' );
    const lastPowerData = await alphaService.getLastPowerData(serialNumber);
    expect(lastPowerData.data).toBeDefined();
    expect(lastPowerData.data.soc).toBeDefined();
    expect(lastPowerData.data).toBeDefined();
    expect(lastPowerData.data.ppv).toEqual(90);
    expect(lastPowerData.data.pbat).toEqual(120);
    expect(lastPowerData.data.soc).toEqual(44);
    expect(lastPowerRoute).toHaveBeenCalledTimes(1);

    // bad response returned
    server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      const detailResponse = new AlphaLastPowerDataResponse();
      ctx.response.body = JSON.stringify(detailResponse);
      ctx.status = 200;
    });

    try {
      await alphaService.getLastPowerData(serialNumber);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err).toContain('could not parse response, missing data in response :');
    }

    server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      const detailResponse = new AlphaLastPowerDataResponseWithNullTestingOnly();
      detailResponse.data = null;
      ctx.response.body = JSON.stringify(detailResponse);
      ctx.status = 200;
    });

    try {
      await alphaService.getLastPowerData(serialNumber);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err).toContain('could not parse response, missing data in response :');
    }

    // partial response returned
    server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      ctx.response.body = '{ \'code\':\'23\' , \'data\':\'xx\' }' ;
      ctx.status = 200;
    });

    //
    try {
      await alphaService.getLastPowerData(serialNumber);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err).toContain('could not parse response, missing data in response :');
    }

    // bad response returned
    server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      ctx.response.body = '{}' ;
      ctx.status = 200;
    });


    try {
      await alphaService.getLastPowerData(serialNumber);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err).toContain('could not parse response, missing data in response :');
    }

    // empty response returned
    server.get('/getLastPowerData').mockImplementationOnce((ctx) => {
      ctx.response.body = '' ;
      ctx.status = 200;
    });


    try {
      await alphaService.getLastPowerData(serialNumber);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err).toContain('could not parse response since it was empty');
    }
  });


  it('positive test: enable loading when currently not loading ', async () => {

    const mockServerUrl ='http://localhost:' + server.getURL().port;

    server.reset();
    const settingsPost = server.post('/updateChargeConfigInfo').mockImplementation((ctx) => {
      const alphaSettingsPostResponse = new AlphaSettingsResponse();
      alphaSettingsPostResponse.code = 200;
      alphaSettingsPostResponse.msg= 'ok';
      alphaSettingsPostResponse.data = new Map<string, unknown>();
      ctx.status = 200;
      ctx.response.status = 200;
      const json = JSON.stringify(alphaSettingsPostResponse);
      ctx.response.body= json;
    });

    const minutes = 45 ;
    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl, 1000, 'serialNumber');

    // when
    const batteryChargeResult = await alphaService.checkAndEnableReloading('serialNumber', true, minutes, 10, 20);

    //then
    expect(settingsPost).toHaveBeenCalledTimes(1);

    expect(batteryChargeResult).toBeDefined();
    expect(batteryChargeResult['gridCharge']).toBe(1);

  });



  it('positive test: check battery is currrently loading ', async () => {
    const mockServerUrl ='http://localhost:' + server.getURL().port;
    const now = new Date();

    const settingsGet = server.get('/getChargeConfigInfo').mockImplementationOnce((ctx) => {
      const alphaSettingsResponse = new AlphaSettingsResponse();
      alphaSettingsResponse.code = 200;
      alphaSettingsResponse.msg= 'ok';
      const loadingSettings = new Map<string, unknown>();
      loadingSettings['timeChaf1'] = now.getHours()+ ':' + (now.getMinutes()-2);
      loadingSettings['timeChae1'] = now.getHours()+ ':' + (now.getMinutes()+2);
      loadingSettings['gridCharge'] = 1;
      alphaSettingsResponse.data = loadingSettings;

      ctx.status = 200;
      ctx.response.status = 200;
      const json = JSON.stringify(alphaSettingsResponse);
      ctx.response.body= json;
    });

    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl, 1000, 'serialNumber' );

    // when
    const batteryChargeResult = await alphaService.isBatteryCurrentlyLoadingCheckNet('checkBatteryLoadingOK');

    //then
    expect(settingsGet).toHaveBeenCalledTimes(1);

    expect(batteryChargeResult).toBeTruthy();
  });



  it('negative test: n battery is currrently loading, feature disabled ', async () => {

    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const now = new Date();

    const settingsGet = server.get('/getChargeConfigInfo').mockImplementation((ctx) => {
      const alphaSettingsResponse = new AlphaSettingsResponse();
      alphaSettingsResponse.code = 200;
      alphaSettingsResponse.msg= 'ok';
      const loadingSettings = new Map<string, unknown>();
      loadingSettings['timeChaf1'] = now.getHours()+ ':' + (now.getMinutes()-2);
      loadingSettings['timeChae1'] = now.getHours()+ ':' + (now.getMinutes()+2);
      loadingSettings['gridCharge'] = 0;
      alphaSettingsResponse.data = loadingSettings;

      ctx.status = 200;
      ctx.response.status = 200;
      const json = JSON.stringify(alphaSettingsResponse);
      ctx.response.body= json;
    });

    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl, 1000, 'serialNumber');

    // when
    const batteryChargeResult = await alphaService.isBatteryCurrentlyLoadingCheckNet('blafasel');

    //then
    expect(settingsGet).toHaveBeenCalledTimes(1);

    expect(batteryChargeResult).toBeFalsy();
  });


  it('negative test: check battery is currrently loading, beginning too far in future  ', async () => {

    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const now = new Date();

    const settingsGet = server.get('/getChargeConfigInfo').mockImplementation((ctx) => {
      const alphaSettingsResponse = new AlphaSettingsResponse();
      alphaSettingsResponse.code = 200;
      alphaSettingsResponse.msg= 'ok';
      const loadingSettings = new Map<string, unknown>();
      loadingSettings['timeChaf1'] = now.getHours()+ ':' + (now.getMinutes()+5);
      loadingSettings['timeChae1'] = now.getHours()+ ':' + (now.getMinutes()+10);
      loadingSettings['gridCharge'] = 1;
      alphaSettingsResponse.data = loadingSettings;

      ctx.status = 200;
      ctx.response.status = 200;
      const json = JSON.stringify(alphaSettingsResponse);
      ctx.response.body= json;
    });

    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl, 1000, 'serialNumber');

    // when
    const batteryChargeResult = await alphaService.isBatteryCurrentlyLoadingCheckNet('blafasel');

    //then
    expect(settingsGet).toHaveBeenCalledTimes(1);

    expect(batteryChargeResult).toBeFalsy();
  });

});




test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '', 1000, 'serialNumber');
  const res = alphaService.getLoadingHourString(10, 16);
  expect(res).toBe('10:30');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '', 1000, 'serialNumber');
  const res = alphaService.getLoadingHourString(11, 36);
  expect(res).toBe('11:45');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '', 1000, 'serialNumber');
  const res = alphaService.getLoadingHourString(9, 45);
  expect(res).toBe('10:00');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '', 1000, 'serialNumber');
  const res = alphaService.getLoadingHourString(23, 55);
  expect(res).toBe('00:00');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '', 1000, 'serialNumber');
  const res = alphaService.getLoadingHourString(0, 5);
  expect(res).toBe('00:15');
});


test('test image rendering', async () => {
  const imageService = new ImageRenderingService();
  const PowerData = [{1:12, 2:11, 3:14, 4:15}];
  const imageUrl = await imageService.graphToImageAlpha('testgraph.png', PowerData );
  expect(imageUrl).toBeDefined();
});

test('test image rendering alpha image', async () => {
  const imageService = new ImageRenderingService();
  const alphaData = new Map<number, AlphaData>();
  let clearIndex = 0;

  while (clearIndex < 96 ) { // 15 min intervall
    alphaData.set(clearIndex, new AlphaData(0, 0, ''+ clearIndex) ) ;
    clearIndex++ ;
  }
  alphaData.set(55, new AlphaData(60, 2000, '' ));
  alphaData.set(56, new AlphaData(80, 1800, '' ));
  alphaData.set(57, new AlphaData(85, 1570, '' ));
  alphaData.set(58, new AlphaData(95, 1300, '' ));
  alphaData.set(59, new AlphaData(98, 1300, '' ));
  alphaData.set(60, new AlphaData(100, 1300, '' ));

  const imageUrl = await imageService.renderImage('testgraph_static.png', alphaData );
  expect(imageUrl).toBeDefined();
});





test('positive test: threshold of Detail Response exceeds config -> trigger value: true ', () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc=21;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(true);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc= 10;
  response.data = data; response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc=21;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 5000, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery && power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 500;
  data.soc=50;
  response.data = data;
  const trigger = alphaService.isTriggered(response, 10000, 20);
  expect(trigger).toEqual(false);
});



test('test enable loading if currently not loading, verify loading minutes (45)', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const loadingMinutes = 45;

  const startedDate = new Date();
  const endDate = new Date();
  endDate.setMinutes(startedDate.getMinutes() + loadingMinutes);

  const responseMap = alphaService.calculateUpdatedSettingsData(true, loadingMinutes, 30, 30);
  expect(responseMap).toBeDefined();
  expect(responseMap['gridCharge']).toBe(1);
  expect(responseMap['timeChaf1']).toBeDefined();
  expect(responseMap['timeChae1']).toBeDefined();
  expect(responseMap['timeChaf2']).toBe('00:00');
  expect(responseMap['timeChae2']).toBe('00:00');

  const expectedLoadingHours = alphaService.getLoadingHourString(startedDate.getHours(), startedDate.getMinutes());
  expect(responseMap['timeChaf1']).toBe(expectedLoadingHours);
  const expectedLoadingHoursEnd = alphaService.getLoadingHourString(endDate.getHours(), endDate.getMinutes());
  expect(responseMap['timeChae1']).toBe(expectedLoadingHoursEnd);

});


test('test enable loading if currently not loading, verify loading minutes (90) ', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const loadingMinutes = 90;

  const startedDate = new Date();
  const endDate = new Date();
  endDate.setMinutes(startedDate.getMinutes() + loadingMinutes);

  const responseMap = alphaService.calculateUpdatedSettingsData(true, loadingMinutes, 30, 30);
  expect(responseMap).toBeDefined();
  expect(responseMap['gridCharge']).toBe(1);
  expect(responseMap['timeChaf1']).toBeDefined();
  expect(responseMap['timeChae1']).toBeDefined();
  expect(responseMap['timeChaf2']).toBe('00:00');
  expect(responseMap['timeChae2']).toBe('00:00');

  const expectedLoadingHours = alphaService.getLoadingHourString(startedDate.getHours(), startedDate.getMinutes());
  expect(responseMap['timeChaf1']).toBe(expectedLoadingHours);
  const expectedLoadingHoursEnd = alphaService.getLoadingHourString(endDate.getHours(), endDate.getMinutes());
  expect(responseMap['timeChae1']).toBe(expectedLoadingHoursEnd);

});


test('test disable loading if when currently loading because time is up ', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const minutesToLoadMaximum = 10;

  const dateBegin = new Date();
  dateBegin.setMinutes(new Date().getMinutes()-15);
  alphaService.setLastLoadingStart(dateBegin); // last loading started 15 minutes ago

  const responseMap = alphaService.calculateUpdatedSettingsData(true, minutesToLoadMaximum, 30, 30);

  expect(responseMap).toBeDefined();
  expect(responseMap['gridCharge']).toBe(0);
  expect(responseMap['timeChaf1']).toBe('00:00');
  expect(responseMap['timeChae1']).toBe('00:00');
  expect(responseMap['timeChaf2']).toBe('00:00');
  expect(responseMap['timeChae2']).toBe('00:00');
});

test('test disable loading if its currently loading. stop loading because time expired', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const minutesToLoadMaximum = 45;
  const dateBegin = new Date();
  dateBegin.setMinutes(new Date().getMinutes()-55);
  alphaService.setLastLoadingStart(dateBegin);

  const responseMap = alphaService.calculateUpdatedSettingsData(true, minutesToLoadMaximum, 30, 30);
  expect(responseMap).toBeDefined(); // undefined - no stopping of loading triggered
  expect(responseMap['gridCharge']).toBe(0);
  expect(responseMap['timeChaf1']).toBe('00:00');
  expect(responseMap['timeChae1']).toBe('00:00');
  expect(responseMap['timeChaf2']).toBe('00:00');
  expect(responseMap['timeChae2']).toBe('00:00');
});


test('test disable loading if its currently loading. do not change settings, since loading via time not expired (already loading)', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080', 1000, 'serialNumber');
  const loadingMinutes = 44; // loading minutes shall last 44 minutes

  const dateBegin = new Date();
  dateBegin.setMinutes(new Date().getMinutes()-30);
  alphaService.setLastLoadingStart(dateBegin); // last loading started 42 minutes ago

  const responseMap = alphaService.calculateUpdatedSettingsData(true, loadingMinutes, 30, 30);
  expect(responseMap).toBeUndefined(); // undefined - no stopping of loading triggered
});
// get the string of the current hour
