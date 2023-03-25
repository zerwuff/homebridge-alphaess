import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';
import { Logging } from 'homebridge';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 600;   // define width and height of the power image
const height = 600;
const backgroundColour = 'white';

//https://github.com/SeanSobey/ChartjsNodeCanvas

export class AlphaImageService{

  private power_image_filename: string ;

  private log: Logging;

  constructor(power_image_filename: string, log: Logging) {
    this.power_image_filename = power_image_filename;
    this.log = log;
  }

  async renderImage(statistics:AlphaStatisticsByDayResponse){
    this.log.debug('renderImage called');
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
    this.log.debug('renderPowerImage called');
    this.renderPowerImage(this.power_image_filename, powerData, batteryData);
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

    this.log.debug('canvas create');
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});
    this.log.debug('canvas created');
    chartJSNodeCanvas.renderToBuffer(configuration, 'image/png').then(
      imageBuffer => {
        this.log.debug('writeFileSync');
        fs.writeFile(fileName, imageBuffer, (err) => {
          if (err) {
            this.log(err);
          } else {
            this.log('Image file written to %s', fileName);
          }
        });
      },
    );



    return fileName;
  }

}