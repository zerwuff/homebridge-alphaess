
import { JsonProperty, JsonClassType } from 'jackson-js';


export class AlphaSettingsResponse {

  @JsonProperty() @JsonClassType({type: () => [Number]})
    code: number;

  @JsonProperty() @JsonClassType({type: () => [Map]})
    data: Map<string, unknown>;
}

/**
export class AlphaData {

    @JsonProperty() @JsonClassType({type: () => [Number]})
      code: number;

    }

{
    "code": 200,
    "info": "Success",
    data		data	Rückgabe von Datensatz
–	batHighCap	decimal	Ladeschluss-SOC(%)
–	gridCharge	int	Umschalter für die Ladung aus Netz (0: aus, 1: ein)
–	timeChae1	string	Ladezeit 1 Endzeit, Zeitformat HH:mm (z.B.: 00:00), maximal 23:45, minimal 00:00
–	timeChae2	string	Ladezeit 2 Endzeit, Zeitformat HH:mm (z.B.: 00:00), maximal 23:45, minimal 00:00
–	timeChaf1	string	Ladezeit 1 Startzeit, Zeitformat HH:mm (z.B.: 00:00), maximal 23:45, minimal 00:00
–	timeChaf2	string	Ladezeit 2 Startzeit, Zeitformat HH:mm (z.B.: 00:00), maximal 23:45, minimal 00:00
}

**/