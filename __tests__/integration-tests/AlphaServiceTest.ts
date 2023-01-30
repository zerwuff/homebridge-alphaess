//import 'jest';
import { assert } from 'console';
import { Logger } from 'homebridge';
import 'jest';
import { AlphaService } from '../../src/alpha/AlphaService';
import { AlphaDetailRespose, AlphaData } from '../../src/alpha/response/AlphaDetailResponse';
import { AlphaLoginResponse } from '../../src/alpha/response/AlphaLoginResponse';

var username = undefined
var password = undefined
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


test("test get detail Data ", async () => {
    if (!username || !password) {
        fail("username or password not defined for this int test")
    }

    var alphaService = new AlphaService(undefined, username, password, logRequestData)
    var alphaLoginResponse = await alphaService.login();
    expect(alphaLoginResponse).toBeDefined();
    expect(alphaLoginResponse.data.AccessToken).toBeDefined();

    var alphaService = new AlphaService(undefined, username, password, logRequestData)
    var getDetailData = await alphaService.getDetailData(alphaLoginResponse.data.AccessToken, serialNumber);
    expect(getDetailData.data).toBeDefined();
    expect(getDetailData.data.soc).toBeDefined();

}) 



test("positive test: threshould of Detail Response exceeds config -> trigger value: true ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.pmeter_l1 = -1000;
    data.pmeter_l2 = -100;
    data.pmeter_l3 = 600;
    data.soc=50;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(true);
}) 

test("positive test: threshould of Detail Response exceeds config -> trigger value: false  (due to battery) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.pmeter_l1 = -1000;
    data.pmeter_l2 = -100;
    data.pmeter_l3 = 600;
    data.soc=10;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(false);
}) 

test("positive test: threshould of Detail Response exceeds config -> trigger value: false  (due to power) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.pmeter_l1 = 1000;
    data.pmeter_l2 = -100;
    data.pmeter_l3 = -600;
    data.soc=50;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(false);
}) 

test("positive test: threshould of Detail Response exceeds config -> trigger value: false  (due to battery && power) ",  () => {
   
    var alphaService = new AlphaService(undefined, "123", "password", true)
    var response = new AlphaDetailRespose();
    var data = new AlphaData();
    data.pmeter_l1 = 1000;
    data.pmeter_l2 = -100;
    data.pmeter_l3 = -600;
    data.soc=10;
    response.data = data;

    var trigger = alphaService.calculateTrigger(response, 500, 20)
    expect(trigger).toEqual(false);
}) 