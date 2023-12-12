

export class Utils {


  isNewDate(now:Date, old:Date){
    if (now === undefined || old === undefined) {
      return false;
    }
    return old.getHours() > now.getHours() ;
  }

}
