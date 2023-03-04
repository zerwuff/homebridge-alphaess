
// serializer message
import { JsonProperty, JsonClassType } from 'jackson-js';

//https://itnext.io/jackson-js-powerful-javascript-decorators-to-serialize-deserialize-objects-into-json-and-vice-df952454cf

export class AlphaStatus {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    soc: number;

  @JsonProperty() @JsonClassType({type: () => [Number]})
    totalPower: number;
}
export class AlphaMessage {

  @JsonProperty() @JsonClassType({type: () => [String]})
    Time: string;

  @JsonProperty() @JsonClassType({type: () => [AlphaStatus]}) ALPHA: AlphaStatus;

}

