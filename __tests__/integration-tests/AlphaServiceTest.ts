import 'jest';
import { MockServer } from 'jest-mock-server';

import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaDetailResponse, AlphaData } from '../../src/alpha/response/AlphaDetailResponse';
import { AlphaImageService } from '../../src/alpha/AlphaImageService';
import { AlphaLoginResponse, LoginReponse } from '../../src/alpha/response/AlphaLoginResponse';
import { AlphaStatisticsByDayResponse, AlphaStatisticsData } from '../../src/alpha/response/AlphaStatisticsByDayResponse';
import { TibberService } from '../../src/tibber/TibberService';

const username = 'fasel';
const password = 'bla';
const serialNumber = 'AE1234';
const logRequestData = false;

describe('Integration Test with Mock Server', () => {
  const server = new MockServer();

  afterAll(() => server.stop());

  beforeAll(() => server.start());

  beforeEach(() => server.reset());

  const loginResponse = new LoginReponse();
  loginResponse.AccessToken = 'SomeAccessToken';
  const accessTokenResponse = new AlphaLoginResponse();
  accessTokenResponse.data = loginResponse;


  it('Test login ', async () => {
    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const loginRoute = server.post('/Account/Login').mockImplementationOnce((ctx) => {
      ctx.response.body = JSON.stringify(accessTokenResponse);
      ctx.status = 200;
    });

    const alphaService = new AlphaService(undefined, username, password, logRequestData, mockServerUrl );
    const alphaLoginResponse = await alphaService.login();

    expect(alphaLoginResponse).toBeDefined();
    expect(alphaLoginResponse.data).toBeDefined();
    expect(alphaLoginResponse.data.AccessToken).toBeDefined();

    expect(loginRoute).toHaveBeenCalledTimes(1);
  });

  it('Test Get Alpha Data ', async () => {
    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const loginRoute = server.post('/Account/Login').mockImplementationOnce((ctx) => {
      ctx.response.body = JSON.stringify(accessTokenResponse);
      ctx.status = 200;
    });


    const detailRoute = server.get('/ESS/GetLastPowerDataBySN').mockImplementationOnce((ctx) => {
      const alphaData = new AlphaData();
      alphaData.ppv1 = 10;
      alphaData.ppv2 = 20;
      alphaData.ppv3 = 30;
      alphaData.soc = 44;
      const detailResponse = new AlphaDetailResponse();
      detailResponse.data = alphaData;
      ctx.response.body = JSON.stringify(detailResponse);
      ctx.status = 200;
    });

    const alphaService = new AlphaService(undefined, username, password, logRequestData, mockServerUrl );
    const alphaLoginResponse = await alphaService.login();
    const details = await alphaService.getDetailData(alphaLoginResponse.data.AccessToken, serialNumber);
    expect(details.data).toBeDefined();
    expect(details.data.soc).toBeDefined();

    expect(details.data).toBeDefined();
    expect(details.data.ppv1).toEqual(10);
    expect(details.data.ppv2).toEqual(20);
    expect(details.data.ppv3).toEqual(30);
    expect(details.data.soc).toEqual(44);
    expect(loginRoute).toHaveBeenCalledTimes(1);
    expect(detailRoute).toHaveBeenCalledTimes(1);
  });


  it('Test Get Statistics by Day data ', async () => {
    const mockServerUrl ='http://localhost:' + server.getURL().port;

    const loginRoute = server.post('/Account/Login').mockImplementationOnce((ctx) => {
      ctx.response.body = JSON.stringify(accessTokenResponse);
      ctx.status = 200;
    });


    const statisticsRoute = server.post('/Power/SticsByDay').mockImplementationOnce((ctx) => {
      const alphaData = new AlphaStatisticsData();
      alphaData.Ppv = [1, 2, 3];
      alphaData.Cbat = [4, 5, 6];
      alphaData.Time = [7, 8, 9 ];
      const detailResponse = new AlphaStatisticsByDayResponse();
      detailResponse.data = alphaData;
      ctx.response.body = JSON.stringify(detailResponse);
      ctx.status = 200;
    });

    const alphaService = new AlphaService(undefined, username, password, logRequestData, mockServerUrl );
    const alphaLoginResponse = await alphaService.login();
    const details = await alphaService.getStatisticsData(alphaLoginResponse.data.AccessToken, serialNumber);
    expect(details.data).toBeDefined();

    expect(details.data).toBeDefined();
    expect(details.data.Ppv).toEqual([1, 2, 3]);
    expect(details.data.Time).toEqual([7, 8, 9]);
    expect(details.data.Cbat).toEqual([4, 5, 6]);

    expect(loginRoute).toHaveBeenCalledTimes(1);
    expect(statisticsRoute).toHaveBeenCalledTimes(1);
  });

});


test('test image rendering', async () => {
  const imageService = new AlphaImageService('testgraph.png');
  const PowerData = [{1:12, 2:11, 3:14, 4:15}];
  const imageUrl = await imageService.graphToImage('testgraph.png', PowerData );
  expect(imageUrl).toBeDefined();
});

test('test image rendering', async () => {
  const imageService = new AlphaImageService('testgraph.png');
  let badResponse = new AlphaStatisticsByDayResponse();
  expect(await imageService.renderImage(badResponse)).toBeFalsy();

  badResponse = new AlphaStatisticsByDayResponse();
  const statistics = new AlphaStatisticsData();
  badResponse.data = statistics;
  expect(await imageService.renderImage(badResponse)).toBeFalsy();

});




test('positive test: threshold of Detail Response exceeds config -> trigger value: true ', () => {
  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaDetailResponse();
  const data = new AlphaData();
  data.ppv1 = 100;
  data.ppv2 = 40;
  data.ppv3 = 600;
  data.ppv4 = 100;
  data.pmeter_dc = 100;
  data.soc=21;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(true);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaDetailResponse();
  const data = new AlphaData();
  data.ppv1 = 100;
  data.ppv2 = 40;
  data.ppv3 = 600;
  data.ppv4 = 100;
  data.pmeter_dc = 100;
  data.soc=10;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 500, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaDetailResponse();
  const data = new AlphaData();
  data.ppv1 = 100;
  data.ppv2 = 40;
  data.ppv3 = 600;
  data.ppv4 = 100;
  data.pmeter_dc = 100;
  data.soc=50;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 5000, 20);
  expect(trigger).toEqual(false);
});

test('negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery && power) ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true, 'http://localhost:8080');
  const response = new AlphaDetailResponse();
  const data = new AlphaData();
  data.ppv1 = 100;
  data.ppv2 = 40;
  data.ppv3 = 600;
  data.ppv4 = 100;
  data.pmeter_dc = 100;
  data.soc=50;
  response.data = data;

  const trigger = alphaService.isTriggered(response, 10000, 20);
  expect(trigger).toEqual(false);
});