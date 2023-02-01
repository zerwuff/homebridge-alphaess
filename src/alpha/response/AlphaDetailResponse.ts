import internal from "stream";

export class AlphaDetailRespose {

    code: Number;
    data: AlphaData;
}

export class AlphaData {

    ppv1: number; // string power
    ppv2: number;
    ppv3: number;
    ppv4: number;


    pmeter_l1: number; // phase power (produced energy) 
    pmeter_l2: number;
    pmeter_l3: number;
    pmeter_dc: number; 
    
    preal_l1: number; // phase power (produced enegery) of the generator 
    preal_l2: number;
    preal_l3: number;

    pbat: number; // charging (-) or discharing (-)

    soc: number; // battery soc


    // {"code":200,"info":"Success"
    // * ,"data":{"ppv1":0.0,"ppv2":0.0,"ppv3":0.0,"ppv4":0.0,"preal_l1":6.0,"preal_l2":8.0,"preal_l3":8.0,"pmeter_l1":207.0,"pmeter_l2":15.0,"pmeter_l3":119.0,"pmeter_dc":0.0,"soc":4.4,"pbat":0.0,"ev1_power":0,"ev2_power":0,"ev3_power":0,"ev4_power":0,"createtime":"2022-12-20 07:02:05","ups_model":0}}

}