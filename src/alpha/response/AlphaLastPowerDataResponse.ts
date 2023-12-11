
import { JsonProperty, JsonClassType } from 'jackson-js';

export class AlphaDataResponse {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;


  @JsonProperty() @JsonClassType({type: () => [Number]})
    ppv: number; // string power

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pbat: number; // charging (-) or discharing (-)

  @JsonProperty() @JsonClassType({type: () => [Number]})
    soc: number; // battery soc

  @JsonProperty() @JsonClassType({type: () => [Number]})
    pload: number; // battery load

  /**
   *
   *  *
 * {
  code: 200,
  msg: "Success",
  expMsg: null,
  data: {
    ppv: 1088,
    ppvDetail: {
      ppv1: 363,
      ppv2: 356,
      ppv3: 0,
      ppv4: 0,
      pmeterDc: 369,
    },
    soc: 11.2,
    pev: 0,
    pevDetail: {
      ev1Power: 0,
      ev2Power: 0,
      ev3Power: 0,
      ev4Power: 0,
    },
    prealL1: 16,
    prealL2: 22,
    prealL3: 9,
    pgrid: -32,
    pgridDetail: {
      pmeterL1: 122,
      pmeterL2: -112,
      pmeterL3: -42,
    },
    pbat: -831,
    pload: 225,
  },
}
   */
}

export class AlphaLastPowerDataResponse {


  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [AlphaDataResponse]})
    data: AlphaDataResponse;

  @JsonProperty() @JsonClassType({type: () => [String]})
    info: string;

}