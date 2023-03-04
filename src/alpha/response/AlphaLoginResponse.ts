
import { JsonProperty, JsonClassType } from 'jackson-js';

export class AlphaLoginResponse {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [LoginReponse]})
    data: LoginReponse;
}

export class LoginReponse {

  @JsonProperty() @JsonClassType({type: () => [String]})
    AccessToken: string;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    ExpiresIn: number;

  @JsonProperty() @JsonClassType({type: () => [String]})
    RefreshTokenKey: string;

  //  Body :{"code":200,"info":"Success","data":{"AccessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJaZWlkbGVyIiwiVXNlck5hbWUiOiJaZWlkbGVyIiwiVXNlcktleSI6IjE0ODQ5IiwiUmVmcmVzaFRva2VuS2V5IjoiM2U0OTY2ODQtYzk1Yy00OWViLWFjMTYtZWYxMDI0OGE5ZThhIiwiTGFuZ3VhZ2VDb2RlIjoiZGUtREUiLCJVc2VyVHlwZXMiOiJjdXN0b21lciIsIlVzZXJMaWNubyI6IiIsIlVzZXJDb250cm9sTmFtZSI6IiIsIklzT0VNVXNlciI6IjAiLCJVc2VyR3JvdXBOYW1lIjoiIiwiVXNlckdyb3VwSWQiOiIwIiwiQWRkaXRpb25hbEZpZWxkcyI6IiIsIkFkZGl0aW9uYWxGaWVsZHMyIjoiIiwibmJmIjoxNjcxNjAzODM2LCJleHAiOjE2NzE2NDM0MzYsImlzcyI6IkFscGhhQ2xvdWQiLCJhdWQiOiJBbHBoYUNsb3VkIn0.YgSJ8NRYQ7LbLwnY2--XoAoOuGDRpAJrje3_VSsbUGs","ExpiresIn":36000,"TokenCreateTime":"2022/12/21 上午7:23:56","RefreshTokenKey":"3e496684-c95c-49eb-ac16-ef10248a9e8a"}}

}