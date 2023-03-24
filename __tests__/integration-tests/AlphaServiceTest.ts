import 'jest';
import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaDetailResponse, AlphaData } from '../../src/alpha/response/AlphaDetailResponse';
import { AlphaImageService } from '../../src/alpha/AlphaImageService';

const username = undefined;
const password = undefined;
const serialNumber = undefined;
const logRequestData = true;
const power_image_filename='power_image_test.png' ;

test('test image rendering', async () => {

  const imageService = new AlphaImageService('testgraph.png');
  const PowerData = {1:12, 2:11, 3:14, 4:15};
  const imageUrl = await imageService.renderPowerImage('testgraph.png', PowerData, {} );
  expect(imageUrl).toBeDefined();
});


test('test login method', async () => {
  if (!username || !password) {
    fail('username or password not defined for this int test');
  }
  const alphaService = new AlphaService(undefined, username, password, logRequestData);
  const alphaLoginResponse = await alphaService.login();

  expect(alphaLoginResponse).toBeDefined();
  expect(alphaLoginResponse.data).toBeDefined();
  expect(alphaLoginResponse.data.AccessToken).toBeDefined();

});


test('test get detail data ', async () => {
  if (!username || !password) {
    fail('username or password not defined for this int test');
  }

  const alphaService = new AlphaService(undefined, username, password, logRequestData);
  const alphaLoginResponse = await alphaService.login();
  console.log ('access token -> %s ', alphaLoginResponse.data.AccessToken);
  expect(alphaLoginResponse).toBeDefined();
  expect(alphaLoginResponse.data.AccessToken).toBeDefined();

  const details = await alphaService.getDetailData(alphaLoginResponse.data.AccessToken, serialNumber);
  expect(details.data).toBeDefined();
  expect(details.data.soc).toBeDefined();

  expect(details.data).toBeDefined();
  expect(details.data.ppv1).toBeDefined();


} );


test('test get statistics by day data ', async () => {
  if (!username || !password) {
    fail('username or password not defined for this int test');
  }

  const alphaImageService = new AlphaImageService('test_rendered.png');
  const alphaService = new AlphaService(undefined, username, password, logRequestData);
  const alphaLoginResponse = await alphaService.login();
  expect(alphaLoginResponse).toBeDefined();
  expect(alphaLoginResponse.data.AccessToken).toBeDefined();
  const statistics = await alphaService.getStatisticsData(alphaLoginResponse.data.AccessToken, serialNumber);

  expect(statistics.data).toBeDefined();
  expect(statistics.data.Cbat).toBeDefined();
  expect(statistics.data.HomePower).toBeDefined();
  await alphaImageService.renderImage(statistics);
} );


test('positive test: threshold of Detail Response exceeds config -> trigger value: true ', () => {

  const alphaService = new AlphaService(undefined, '123', 'password', true);
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

  const alphaService = new AlphaService(undefined, '123', 'password', true);
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

  const alphaService = new AlphaService(undefined, '123', 'password', true);
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

  const alphaService = new AlphaService(undefined, '123', 'password', true);
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