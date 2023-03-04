
import { JsonProperty, JsonClassType } from 'jackson-js';

export class AlphaData {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    ppv1: number; // string power

  @JsonProperty() @JsonClassType({type: () => [Number]})
    ppv2: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    ppv3: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    ppv4: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pmeter_l1: number; // phase power (produced energy)

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pmeter_l2: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pmeter_l3: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pmeter_dc: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    preal_l1: number; // phase power (produced enegery) of the generator

  @JsonProperty() @JsonClassType({type: () => [Number]})
    preal_l2: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    preal_l3: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pbat: number; // charging (-) or discharing (-)

  @JsonProperty() @JsonClassType({type: () => [Number]})
    soc: number; // battery soc


  // {"code":200,"info":"Success"
  // * ,"data":{"ppv1":0.0,"ppv2":0.0,"ppv3":0.0,"ppv4":0.0,"preal_l1":6.0,"preal_l2":8.0,"preal_l3":8.0,"pmeter_l1":207.0,"pmeter_l2":15.0,"pmeter_l3":119.0,"pmeter_dc":0.0,"soc":4.4,"pbat":0.0,"ev1_power":0,"ev2_power":0,"ev3_power":0,"ev4_power":0,"createtime":"2022-12-20 07:02:05","ups_model":0}}

}

export class AlphaDetailResponse {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [AlphaData]})
    data: AlphaData;
}