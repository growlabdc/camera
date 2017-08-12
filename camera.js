const PiCamera = require('pi-camera');
const config = require('./config')


module.exports = () => {
  const myCamera = new PiCamera({
    mode: 'photo',
    output: config.image_path,
    width: config.image.width,
    height: config.image.height,
    encoding: config.image.encoding,
    nopreview: true
  })
  

  myCamera.snap().then((result) => {
    console.log(result)
  }).catch((error) => {
    console.log(err)
  })
}
