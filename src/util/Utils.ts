

export class Utils {


  isNewDate(now:Date, old:Date){
    if (now === undefined || old === undefined) {
      return false;
    }
    const diff = new Date (now.getTime() - old.getTime());

    const dateDiff = diff.getUTCDate();
    const isNew = dateDiff > 1 ;
    return isNew ;
  }

}
