import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 600;   // define width and height of the power image
const height = 600;
const backgroundColour = 'white';

//https://github.com/SeanSobey/ChartjsNodeCanvas

export class AlphaImageService{

  private power_image_filename: string ;

  constructor(power_image_filename: string ) {
    this.power_image_filename = power_image_filename;
  }

  async renderImage(statistics:AlphaStatisticsByDayResponse){
    const powerData = {};
    const batteryData = {};
    let cnt = 0;
    // make 2 object maps out of response, key is timeStamp
    statistics.data.Time.forEach(timeStamp => {
      const ppv = statistics.data.Ppv[cnt] * 100;
      const soc = statistics.data.Cbat[cnt];
      powerData[timeStamp]= ppv*10;
      batteryData[timeStamp]= soc;
      cnt++;
    });
    return this.renderPowerImage(this.power_image_filename, powerData, batteryData);
  }

  // renders the power Image and save it to file
  async renderPowerImage(fileName: string, powerData: object, batteryData:object ) {
    const configuration= {
      type: 'bar',
      data: {
        datasets: [
          {// pv
            label: 'PV (W)',
            data: powerData,
            backgroundColor: [
              'rgba(235, 95, 52, 0.5)',
            ],
            borderColor: [
              'rgba(235,95,52,1)',
            ],
            borderWidth: 1,
            yAxisID: 'yAxisPower',
          },
          { // battery
            label: 'SOC (%)',
            data: batteryData,
            backgroundColor: [
              'rgba(52, 131, 235, 0.5)',
            ],
            borderColor: [
              'rgba(52,131,235,1)',
            ],
            borderWidth: 1,
            yAxisID: 'yAxisSOC',
          },
        ],
      },
      options: {
        animation: {
          duration: 0, // general animation time
        },
        hover: {
          animationDuration: 0, // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
        scales: {
          yAxisPower: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Power (W)',
              color:  'rgba(235,95,52,1)',
            },
          },
          yAxisSOC: {
            type: 'linear',
            min:0,
            max:100,
            title: {
              display: true,
              text:'SOC %',
              color: 'rgba(52,131,235,1)',
            },
            position: 'right',
          },
        },
      },
    };

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});
    const imageBuffer= chartJSNodeCanvas.renderToBufferSync(configuration, 'image/png');
    fs.writeFileSync(fileName, imageBuffer);

    return fileName;
  }

}