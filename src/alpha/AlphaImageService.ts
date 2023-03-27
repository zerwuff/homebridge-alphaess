import { AlphaStatisticsByDayResponse } from './response/AlphaStatisticsByDayResponse';
const fs = require('fs');
const sharp = require('sharp');
const vega = require('vega');
const lite = require('vega-lite');

const width = 600;   // define width and height of the power image
const height = 600;
const backgroundColour = 'white';



export class AlphaImageService{
  private power_image_filename: string ;

  constructor(power_image_filename: string) {
    this.power_image_filename = power_image_filename;
  }


  async graphToImage (fileName: string, values: object) {
    const vlSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v3.json',
      width: width,
      height: height,
      background: backgroundColour,
      padding: 2,
      data : {
        values: values,
      },
      layer: [
        {
          mark: {
            type: 'line',
            color: 'orangered',
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
            color: '#85C5A6',
            opacity: 0.7,
          },
          encoding: {
            x: {
              field: 'time',
              type: 'nominal',
              title: '24 hrs',
              axis: {
                labels: false,
                tickCount: 10,
                tickSize: 0,
              },
            },
            y: {
              sort:'ascending',
              field: 'soc',
              axis: {'orient':'right', 'format':'~s', 'grid': true, 'ticks': false},
              title: 'SOC %',
              type: 'quantitative',
            },
          },
        },
      ],
    };

    const vegaspec = lite.compile(vlSpec).spec;
    //console.log(JSON.stringify(vlSpec));
    const view = new vega.View(vega.parse(vegaspec), {renderer: 'none'});

    // Generate an SVG string
    view.resize(width, height).toSVG().then(async (svg) => {
      // console.log(svg);
      // Working SVG string
      await sharp(Buffer.from(svg))
        .toFormat('png')
        .toFile(this.power_image_filename);
    }).catch((err) => {
      console.error(err);
    });

    return view;
  }

  async renderImage(statistics:AlphaStatisticsByDayResponse){
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

    this.graphToImage(this.power_image_filename, values);
  }

}