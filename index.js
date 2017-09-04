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

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=' + (config.capture_interval / 1000));
  res.sendFile(config.image.output)
})

http.listen(config.port, function() {
  logger.info('listening on *:8081')
})

setInterval(camera_capture, config.capture_interval)
setInterval(upload, config.upload_interval)
