//import 'jest';
import { assert } from 'console';
import { Logger } from 'homebridge';
import 'jest';
import { AlphaService } from '../../src/alpha/AlphaService';
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