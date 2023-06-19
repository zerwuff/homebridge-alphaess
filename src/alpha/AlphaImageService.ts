import { stat } from 'fs';
import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';
const fs = require('fs');
const sharp = require('sharp');
const vega = require('vega');
const lite = require('vega-lite');

const width = 640;   // define width and height of the power image
const height = 320;
const backgroundColour = 'white';
const pading = 45;

const colorPower = '#ff6a2fb1';
const colorBattery = '#85C5A6';

export class AlphaImageService{
  private power_image_filename: string ;
  constructor(power_image_filename: string) {
    this.power_image_filename = power_image_filename;
  }

  async graphToImageTibber (fileName: string, values: object) {
    const vlSpecTibber = {
      $schema: 'https://vega.github.io/schema/vega-lite/v3.json',
      width: width,
      height: height,
      background: backgroundColour,
      padding: pading,
      config: {'font':'Tahoma'},
      data : {
        values: values,
      },
      layer: [
        {
          mark: {
            type: 'line',
            color:  colorPower,
          },
          title:'Tibber Price',
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: false,
                tickSize: 0,
                labelAlign: 'left',
              },
            },
            y: {
              sort:'descending',
              field: 'cnt',
              title: 'Cents',
              type: 'nominal',
              axis: {
                labelOverlap: 'parity',
                orient:'left',
                format:'.2',
              },
            },
          },
        },
        {
          title:'Trigger',
          mark: {
            type: 'bar',
            color: colorBattery,
            opacity: 0.7,
          },
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: false,
                tickSize: 0,
              },
            },
            y: {
              sort:'ascending',
              field: 'trigger',
              axis: {'orient':'right', 'format':'~s', 'grid': true, 'ticks': false},
              title: 'Trigger ',
              values: [0, 1],
              type: 'quantitative',
              scale: {'domain': [0, 1]},
            },
          },
        },
      ],
    };

    const vegaspec = lite.compile(vlSpecTibber).spec;
    const view = new vega.View(vega.parse(vegaspec), {renderer: 'none'});

    // Generate an SVG string
    view.resize(width, height).toSVG().then(async (svg) => {
      await sharp(Buffer.from(svg))
        .toFormat('png')
        .toFile(fileName).catch(error => {
          console.error(' error rendering:' + error);
        });
    }).catch((err) => {
      console.error(err);
    });

    return view;
  }

  async graphToImageAlpha (fileName: string, values: object) {
    const vlSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v3.json',
      width: width,
      height: height,
      background: backgroundColour,
      padding: pading,
      config: {'font':'Tahoma'},
      data : {
        values: values,
      },
      layer: [
        {
          mark: {
            type: 'line',
            color:  colorPower,
          },
          title:'Power / SOC',
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: false,
                tickSize: 0,
                labelAlign: 'left',
              },
            },
            y: {
              sort:'descending',
              field: 'ppv',
              title: 'Power (Watts)',
              type: 'nominal',
              axis: {
                labelOverlap: 'parity',
                orient:'left',
                format:'~s',
              },
            },
          },
        },
        {
          title:'SOC',
          mark: {
            type: 'bar',
            color: colorBattery,
            opacity: 0.7,
          },
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: false,
                tickSize: 0,
              },
            },
            y: {
              sort:'ascending',
              field: 'soc',
              axis: {'orient':'right', 'format':'~s', 'grid': true, 'ticks': false},
              title: 'SOC %',
              values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
              type: 'quantitative',
              scale: {'domain': [0, 100]},
            },
          },
        },
      ],
    };

    const vegaspec = lite.compile(vlSpec).spec;
    const view = new vega.View(vega.parse(vegaspec), {renderer: 'none'});

    // Generate an SVG string
    view.resize(width, height).toSVG().then(async (svg) => {
      await sharp(Buffer.from(svg))
        .toFormat('png')
        .toFile(this.power_image_filename);
    }).catch((err) => {
      console.error(err);
    });

    return view;
  }

  async renderImage(statistics:AlphaStatisticsByDayResponse): Promise<boolean>{
    if (this.power_image_filename === undefined){
      return false;
    }
    if (statistics === null || (statistics!==null && statistics.data === null) ||
        (statistics.data === undefined) || (statistics.data !== undefined && statistics.data.Time === undefined) ){
      console.log('statistics response is empty, skipping image rendering');
      return false;
    }

    const powerData = {};
    const batteryData = {};
    let cnt = 0;
    const values = [];
    statistics.data.Time.forEach(timeStamp => {
      const ppv = statistics.data.Ppv[cnt] * 100;
      const soc = statistics.data.Cbat[cnt];
      powerData[timeStamp]= ppv*10;
      batteryData[timeStamp]= soc;
      cnt++;
      const entry = {timeStamp: timeStamp, time:cnt, ppv: ppv*10, soc:soc};
      values.push(entry);
    });
    this.graphToImageAlpha(this.power_image_filename, values);
    return true;
  }

}