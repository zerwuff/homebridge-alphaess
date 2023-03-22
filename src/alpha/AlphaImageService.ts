const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

const width = 600;   // define width and height of canvas
const height = 600;
const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp


//https://github.com/SeanSobey/ChartjsNodeCanvas

export class AlphaImageService{


  async renderImage(fileName: string, powerData: object ) {

    const configuration= {
      type: 'line',
      data: {
        datasets: [ {
          label: 'Power line',
          labels: ['a', 'b'],
          dataOLD: {
            January: 10,
            February: 20,
          },
          data: powerData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
          ],
          borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 4,
        } ],
      },
      options: {
        animation: {
          duration: 0, // general animation time
        },
        hover: {
          animationDuration: 0, // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
        scalesXXX: {
          x: {
            type: 'linear',
          },
          y: {
            type: 'linear',
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