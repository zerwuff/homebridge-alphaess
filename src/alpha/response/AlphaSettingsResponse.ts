
import { JsonProperty, JsonClassType } from 'jackson-js';

export class AlphaSettingsResponse {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [String]})
    msg: string;

  @JsonProperty() @JsonClassType({type: () => [Map]})
    data: Map<string, unknown>;
}


