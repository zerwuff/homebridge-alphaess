import 'jest';
import { MockServer } from 'jest-mock-server';

import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaData } from '../../src/interfaces';
import { AlphaLastPowerDataResponse, AlphaDataResponse } from '../../src/alpha/response/AlphaLastPowerDataResponse';
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

    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl );
    const lastPowerData = await alphaService.getLastPowerData(serialNumber);
    expect(lastPowerData.data).toBeDefined();
    expect(lastPowerData.data.soc).toBeDefined();

    expect(lastPowerData.data).toBeDefined();
    expect(lastPowerData.data.ppv).toEqual(90);
    expect(lastPowerData.data.pbat).toEqual(120);
    expect(lastPowerData.data.soc).toEqual(44);
    expect(lastPowerRoute).toHaveBeenCalledTimes(1);
  });


  it('positive test: enable loading when currently not loading ', async () => {

    const mockServerUrl ='http://localhost:' + server.getURL().port;
    const settingsPost = server.post('/updateChargeConfigInfo').mockImplementation((ctx) => {
      ctx.status = 200;
      ctx.response.status = 200;
      ctx.response.body= '';
    });

    const settingsGetNotLoading = server.get('/getChargeConfigInfo').mockImplementation((ctx) => {
      const data = new Map<string, string>;
      const alphaSettings = new AlphaSettingsResponse();
      alphaSettings.data = data;
      ctx.response.body = JSON.stringify(alphaSettings);
      ctx.status = 200;
    });

    const minutes = 45 ;
    const alphaService = new AlphaService(undefined, appid, secret, logRequestData, mockServerUrl );

    // when
    const batteryChargeResult = await alphaService.checkAndEnableReloading('serialNumber', true, minutes, 10, 20);

    //then
    expect(settingsGetNotLoading).toHaveBeenCalledTimes(1);
    expect(settingsPost).toHaveBeenCalledTimes(1);

    expect(batteryChargeResult).toBeDefined();
    expect(batteryChargeResult['gridCharge']).toBe(1);

  });






});




test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '');
  const res = alphaService.getLoadingHourString(10, 16);
  expect(res).toBe('10:30');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '');
  const res = alphaService.getLoadingHourString(11, 36);
  expect(res).toBe('11:45');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '');
  const res = alphaService.getLoadingHourString(9, 45);
  expect(res).toBe('10:00');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '');
  const res = alphaService.getLoadingHourString(23, 55);
  expect(res).toBe('00:00');
});

test('test loading hours ', () => {
  const alphaService = new AlphaService(undefined, appid, secret, logRequestData, '');
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
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc=21;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(true);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc= 10;
  response.data = data; response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 750;
  data.soc=21;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 5000, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery && power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaLastPowerDataResponse();
  const data = new AlphaDataResponse();
  data.ppv = 500;
  data.soc=50;
  response.data = data;
  const trigger = alphaService.isTriggered(response, 10000, 20);
  expect(trigger).toEqual(false);
});


// next hour loading string
function getLoadingHourString(hour:number, minute:number ): string {
  let minuteString = ':15';
  let hourString = new String(hour);

  if (minute> 15){
    minuteString = ':30';
  }
  if (minute> 30){
    minuteString = ':45';
  }
  if (minute>=45){
    minuteString = ':00';
    hour = hour + 1;
    hourString = new String(hour);
    if (hour >=24 ){
      hour = 0;
      hourString = '00';
    }
  }
  if (hour < 10){
    hourString = '0' + hour;
  }
  return hourString + minuteString;
}


test('test enable loading if currently not loading. ', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const settingsMap = new Map<string, string>;
  const minutes = 45;
  settingsMap['gridCharge']=0;

  const responseMap = alphaService.calculateUpdatedSettingsData(settingsMap, true, minutes, 30, 30);
  const date = new Date();
  expect(responseMap).toBeDefined();
  expect(responseMap['gridCharge']).toBe(1);
  settingsMap['timeChaf1']=getLoadingHourString(date.getHours(), date.getMinutes());
  settingsMap['timeChae1']=getLoadingHourString(date.getHours(), date.getMinutes());

});




test('test disable loading if when currently loading because time is up ', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const settingsMap = new Map<string, string>;
  const date = new Date();
  const minutesToLoadMaximum = 10;

  settingsMap['gridCharge']=1;
  settingsMap['timeChaf1']=getLoadingHourString(date.getHours()-2, date.getMinutes()); // starting 2 minutes ago
  settingsMap['timeChae1']=getLoadingHourString(date.getHours(), date.getMinutes()+20); // end in 20 minutes

  const dateBegin = new Date();
  dateBegin.setMinutes(new Date().getMinutes()-15);
  alphaService.setLastLoadingStart(dateBegin); // last loading started 15 minutes ago

  const responseMap = alphaService.calculateUpdatedSettingsData(settingsMap, true, minutesToLoadMaximum, 30, 30);

  expect(responseMap).toBeDefined();
  expect(responseMap['gridCharge']).toBe(0);
  expect(responseMap['timeChaf1']).toBe('00:00');
  expect(responseMap['timeChae1']).toBe('00:00');
});

test('test disable loading if its currently loading. do not change settings, since loading via time not expired (first start)', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const settingsMap = new Map<string, string>;
  const date = new Date();
  const minutes = 45;

  settingsMap['gridCharge']=1;
  settingsMap['timeChaf1']=getLoadingHourString(date.getHours()-2, date.getMinutes()); //loading start 2 hours ago
  settingsMap['timeChae1']=getLoadingHourString(date.getHours(), date.getMinutes()+2); // loading shall end in 15 minutes

  const responseMap = alphaService.calculateUpdatedSettingsData(settingsMap, true, minutes, 30, 30);
  expect(responseMap).toBeUndefined(); // undefined - no stopping of loading triggered
});


test('test disable loading if its currently loading. do not change settings, since loading via time not expired (already loading)', async () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const settingsMap = new Map<string, string>;
  const date = new Date();
  const loadingMinutes = 44; // loading minutes shall last 44 minutes

  settingsMap['gridCharge']=1;
  settingsMap['timeChaf1']=getLoadingHourString(date.getHours()-2, date.getMinutes()); //loading start 2 hours ago
  settingsMap['timeChae1']=getLoadingHourString(date.getHours(), date.getMinutes()+2); // loading shall end in 15 minutes

  const dateBegin = new Date();
  dateBegin.setMinutes(new Date().getMinutes()-42);
  alphaService.setLastLoadingStart(dateBegin); // last loading started 42 minutes ago

  const responseMap = alphaService.calculateUpdatedSettingsData(settingsMap, true, loadingMinutes, 30, 30);
  expect(responseMap).toBeUndefined(); // undefined - no stopping of loading triggered
});
// get the string of the current hour
