import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';
import { AlphaTrigger } from '../interfaces';
import { PriceTrigger } from '../interfaces';

const sharp = require('sharp');
const vega = require('vega');
const lite = require('vega-lite');

const width = 1024;   // define width and height of the power image
const height = 768;
const backgroundColour = 'white';
const pading = 45;
const IMAGE_INDEX_LENGHT = 96;

const colorPower = '#ff6a2fb1';
const colorBattery = '#85C5A6';
const colorTibber = '#3277a8';
const colorTriggerTibber = '#ebc934';
const colorTriggerAlpha = '#ff6a2fb1';

export class ImageRenderingService{

  // render current Image from current values
  async renderTriggerImage(fileName:string, tibberMap:Map<number, PriceTrigger>, alphaMap:Map<number, AlphaTrigger>): Promise<void> {
    if (fileName===undefined){
      console.error('filename is not defined - not rendering trigger image ');
      return;
    }
    console.debug('render image triggered with data points ', tibberMap, alphaMap);

    let index = 0;
    const values = new Array(0);
    const runninDate = new Date();
    runninDate.setHours(0);
    runninDate.setMinutes(0);
    runninDate.setSeconds(0);

    while (index < IMAGE_INDEX_LENGHT ) { // 15 min intervall
      let triggerAlpha = 0;
      let entry = {time: runninDate.toISOString(), cnt: 0, triggerTibber:0, triggerAlpha:triggerAlpha};

      if (alphaMap.get(index)!==undefined){
        triggerAlpha = alphaMap.get(index).trigger;
      }

      if (tibberMap.get(index)!==undefined){
        const priceCnt = tibberMap.get(index).price;
        const trigger = tibberMap.get(index).trigger;
        const date = tibberMap.get(index).date;
        entry = {time: date.toISOString(), cnt: priceCnt, triggerTibber:trigger, triggerAlpha:triggerAlpha};
      }

      values.push(entry);

      runninDate.setMinutes(runninDate.getMinutes()+15);
      index++ ;
    }
    return this.graphToImageTibber(fileName, values).catch(error => {
      console.error('Error occured during tibber image rendering', error);
    });
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
        name: 'table',
        values: values,

      },
      encoding: {
        x: {
          field: 'time',
          type:'ordinal',
          timeUnit: 'hoursminutes',
          title: 'time',
        },
        axis: {labelAngle: 45},
      },
      layer: [
        {
          mark: {
            type: 'line',
            color:  colorTibber,
          },
          title:'Tibber Price',
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: true,
              },
            },
            y: {
              sort:'ascending',
              field: 'cnt',
              title: 'Cents',
              type: 'quantitative',
              axis: {
                labelOverlap: 'parity',
                orient:'left',
                format:'.2',
                titleColor:  colorTibber,
              },
            },
          },
        },
        {
          mark: {
            type: 'line',
            color:  colorTriggerTibber,
          },
          title:'Trigger Tibber',
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: true,
              },
            },
            y: {
              sort:'ascending',
              field: 'triggerTibber',
              title: 'Trigger Tibber',
              axis: {'orient':'right', 'format':'~s', 'grid': true, 'ticks': false, labelSeparation:500, titleColor: colorTriggerTibber },
              values: [0, 1],
              type: 'nominal',
              scale: {'domain': [1, 0]},
            },
          },

        },
        {
          mark: {
            type: 'line',
            color:  colorTriggerAlpha,
            opacity: 0.7,
          },
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: true,
              },
            },
            y: {
              sort:'ascending',
              field: 'triggerAlpha',
              title: 'TriggerAlpha',
              axis: {'orient':'right', 'format':'~s', 'grid': true, 'ticks': false, labelPadding:25, titleColor: colorTriggerAlpha },
              values: [0, 1],
              type: 'nominal',
              scale: {'domain': [1, 0]},
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
          console.error('error rendering:' + error);
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
        .toFile(fileName);
    }).catch((err) => {
      console.error(err);
    });

    return view;
  }

  async renderImage(power_image_filename:string, statistics:AlphaStatisticsByDayResponse): Promise<boolean>{

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
    this.graphToImageAlpha(power_image_filename, values);
    return true;
  }

}