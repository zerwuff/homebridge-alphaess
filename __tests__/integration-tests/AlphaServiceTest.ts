//import 'jest';
import { assert } from 'console';
import { Logger } from 'homebridge';
import 'jest';
import { syncBuiltinESMExports } from 'module';
import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaDetailRespose, AlphaData } from '../../src/alpha/response/AlphaDetailResponse';
import { AlphaLoginResponse } from '../../src/alpha/response/AlphaLoginResponse';

var username = undefined;
var password = undefined;
var serialNumber = undefined; 
var logRequestData = true;

test("test login method", async () => {
    if (!username || !password) {
        fail("username or password not defined for this int test")
    }
    var log = undefined
    var alphaService = new AlphaService(undefined, username, password, logRequestData)
    var alphaLoginResponse = await alphaService.login();

    expect(alphaLoginResponse).toBeDefined();
    console.log(alphaLoginResponse);
    expect(alphaLoginResponse.data).toBeDefined();
    expect(alphaLoginResponse.data.AccessToken).toBeDefined();

})


test("test get detail data ", async () => {
    if (!username || !password) {
        fail("username or password not defined for this int test")
    }

    var alphaService = new AlphaService(undefined, username, password, logRequestData)
    var alphaLoginResponse = await alphaService.login();
    console.log ("access token -> " + alphaLoginResponse.data.AccessToken)
    expect(alphaLoginResponse).toBeDefined();
    expect(alphaLoginResponse.data.AccessToken).toBeDefined();

    var details = await alphaService.getDetailData(alphaLoginResponse.data.AccessToken, serialNumber);
    expect(details.data).toBeDefined();
    expect(details.data.soc).toBeDefined();

    var trigger = alphaService.calculateTrigger(details,66,22);
    expect(details.data).toEqual(true);
} );



test("positive test: threshold of Detail Response exceeds config -> trigger value: true ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.ppv1 = 100
    data.ppv2 = 40;
    data.ppv3 = 600;
    data.ppv4 = 100;
    data.pmeter_dc = 100;
    data.soc=21;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(true);
}) 

test("negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.ppv1 = 100
    data.ppv2 = 40;
    data.ppv3 = 600;
    data.ppv4 = 100;
    data.pmeter_dc = 100;
    data.soc=10;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(false);
}) 

test("negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to power) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.ppv1 = 100
    data.ppv2 = 40;
    data.ppv3 = 600;
    data.ppv4 = 100;
    data.pmeter_dc = 100;
    data.soc=50;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 5000, 20)
    expect(trigger).toEqual(false);
}) 

test("negative test: threshold of Detail Response exceeds config -> trigger value: false  (due to battery && power) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.ppv1 = 100
    data.ppv2 = 40;
    data.ppv3 = 600;
    data.ppv4 = 100;
    data.pmeter_dc = 100;
    data.soc=50;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 10000, 20)
    expect(trigger).toEqual(false);
}) 