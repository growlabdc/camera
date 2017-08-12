'use strict'

let config
try {
  config = require('./config')
} catch(e) {
  throw new Error('missing config file')
}

const express = require('express')
const app = express()
const http = require('http').Server(app)
const Logger = require('logplease')

const camera_capture = require('./camera')
const upload = require('./upload')

const logger = Logger.create('server')

app.get('/image.jpg', (req, res) => {
  res.sendFile(config.image_path)
})

http.listen(config.port, function() {
  logger.info('listening on *:8081')
})

setInterval(camera_capture, config.capture_interval)
setInterval(upload, config.upload_interval)
