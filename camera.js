const RaspiCam = require('raspicam')
const config = require('./config')
const Logger = require('logplease')

const logger = Logger.create('camera')


module.exports = () => {
  const camera = new RaspiCam(config.image)

  camera.on('start', function(){
    logger.info('capture started')
  })

  camera.on('read', function(err, timestamp, filename){
    if (err)
      logger.error(err)

    logger.info(`capture completed: ${timestamp} - ${filename}`)
  })

  camera.start()  
}
