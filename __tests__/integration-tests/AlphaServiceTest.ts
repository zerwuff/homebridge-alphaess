//import 'jest';
import { assert } from 'console';
import { Logger } from 'homebridge';
import 'jest';
import { AlphaService } from '../../src/alpha/AlphaService';

var username = undefined ;// 
var password = undefined ;//
var serialNumber = undefined; 
var token: String;
var logRequestData = true;

test("1 test login method", async () => {
    if (!username || !password){
        fail("username or password not defined for this int test")
    }
    var log = undefined
    var alphaService = new AlphaService(undefined,username,password,logRequestData)
    token = await alphaService.login();
})

test("2 test get detail Data ", async () => {
    if (!username || !password){
        fail("username or password not defined for this int test")
    }
    var log = undefined
    var alphaService = new AlphaService(undefined,username,password,logRequestData)
    var getDetailData =  await alphaService.getDetailData(token,serialNumber);
    expect(getDetailData.data).toBeDefined();
    expect(getDetailData.data.soc).toBeDefined();

})