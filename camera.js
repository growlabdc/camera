const RaspiCam = require('raspicam')
const config = require('./config')
const Logger = require('logplease')

const logger = Logger.create('camera')


module.exports = () => {
  const camera = new RaspiCam({
    encoding: config.image.encoding,
    mode: 'photo',
    output: config.image_path,
    width: config.image.width,
    height: config.image.height,
    timeout: 0
  })

  camera.start()

  camera.stop()

  camera.on('start', function(){
    logger.info('capture started')
  })

  camera.on('read', function(err, timestamp, filename){
    if (err)
      logger.error(err)

    logger.info(`capture completed: ${timestamp} - ${filename}`)
  })
}
