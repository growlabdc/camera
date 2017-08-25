const fs = require('fs')
const moment = require('moment')
const async = require('async')
const Logger = require('logplease')
const logger = Logger.create('timelapse')
const videoshow = require('videoshow')
const argv = require('yargs').argv
const jsonfile = require('jsonfile')
const nodemailer = require('nodemailer')

const config = require('../config')
const tokens = require('../tokens')

const google = require('googleapis')
const OAuth2 = google.auth.OAuth2
const oauth2Client = new OAuth2(
  config.clientId,
  config.clientSecret,
  config.redirectUrl
)

oauth2Client.setCredentials({
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  // Optional, provide an expiry_date (milliseconds since the Unix Epoch)
  // expiry_date: (new Date()).getTime() + (1000 * 60 * 60 * 24 * 7)
})

oauth2Client.refreshAccessToken(function(err, tokens) {
  if (err) logger.error(err)

  jsonfile.writeFileSync('../tokens.json', {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  })
})

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
})

let files = []
let images = []

const now = moment()
const dayAgo = moment().subtract(24, 'hour')
let light_start = moment(16, 'H')
let light_end = moment(10, 'H')

if (now.isAfter(light_start, 'minute'))
  light_end.add(24, 'hour')
else
  light_start.subtract(24, 'hour')

function fetchPage(folderId, pageToken, pageFn, cb) {
  logger.info(`fetching ${pageToken}`)

  drive.files.list({
    q: `'${folderId}' in parents`,
    orderBy: 'createdTime desc',
    pageToken: pageToken
  }, function(err, resp) {
    if (err)
      return cb(err)

    let getNext = true

    resp.files.forEach(function(file) {
      const timestamp = parseInt(file.name.substring(0, 13), 10)
      file.time = moment(timestamp)

      if (file.time.isBefore(dayAgo, 'day')) {
	getNext = false
      } else files.push(file)
    })

    if (getNext && resp.nextPageToken)
      pageFn(folderId, resp.nextPageToken, pageFn, cb)
    else
      cb()
  })
}

function download(file, cb) {
  const path = `/tmp/${file.name}`
  logger.info(`downloading ${file.id} to ${path}`)
  const exists = fs.existsSync(path)

  if (exists) {
    logger.info('path exists')
    return cb()
  }

  const dest = fs.createWriteStream(path)  

  drive.files.get({
    fileId: file.id,
    alt: 'media'
  }).on('end', cb).on('error', cb).pipe(dest)
}

function run(opts, cb) {
  fetchPage(opts.folderId, null, fetchPage, function(err) {
    if (err)
      return cb(err)

    logger.info(`Found ${files.length} images`)

    files.forEach((file, index) => {
      const isValid = file.time.isBetween(light_start, light_end, 'minute')
      logger.info(`${file.time.format('Do HH:mm')} is ${isValid ? 'valid' : 'invalid'}`)

      if (isValid) {
	images.push({
	  path: `/tmp/${file.name}`,
	  caption: `${opts.name} on the ${files[files.length - 1].time.format('Do')}`
	})
      } else {
	files.splice(index, 1)
      }
    })

    images.reverse()

    async.eachLimit(files, 3, download, (err) => {
      if (err)
	return cb(err)

      logger.info('download complete')

      const videoOptions = {
	fps: 25,
	loop: .1, // seconds
	transition: false,
	transitionDuration: 0, // seconds
	videoBitrate: 1024,
	videoCodec: 'libx264',
	size: '1920x1200',
	//audioBitrate: '128k',
	//audioChannels: 2,
	format: 'mp4',
	pixelFormat: 'yuv420p',
	subtitleStyle: {
	  Fontname: 'Verdana',
	  Fontsize: '26',
	  PrimaryColour: '11861244',
	  SecondaryColour: '11861244',
	  TertiaryColour: '11861244',
	  BackColour: '-2147483640',
	  Bold: '2',
	  Italic: '0',
	  BorderStyle: '2',
	  Outline: '2',
	  Shadow: '3',
	  Alignment: '1', // left, middle, right
	  MarginL: '40',
	  MarginR: '60',
	  MarginV: '40'
	}	
      }

      videoshow(images, videoOptions).save(opts.video_path).on('start', function (command) {
	logger.info('ffmpeg process started:', command)
      }).on('error', function (err, stdout, stderr) {
	logger.error('Error:', err)
	logger.error('ffmpeg stderr:', stderr)
	cb(err)
      }).on('end', function (output) {
	logger.info('Video created in:', output)
	cb()
      })
    })
  })
}

module.exports = run

if (!module.parent) {
  const folderId = argv.folder || '0B-H6JCTpHFZbRURVRFJqekpUZnM'
  const name = argv.name || 'Peach'
  const video_path = `/tmp/${name}.mp4`

  run({
    folderId: folderId,
    name: name,
    video_path: video_path
  }, function(err) {
    if (err)
      return logger.error(err)

    logger.info('Complete')

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // secure:true for port 465, secure:false for port 587
      auth: {
	type: 'OAuth2',
	clientId: config.gmail.clientId,
	clientSecret: config.gmail.clientSecret
      }
    })

    // setup email data with unicode symbols
    let mailOptions = {
      from: config.gmail.user,
      to: config.gmail.to,
      subject: `GrowLab: ${name}`, // Subject line
      text: 'Hi', // plain text body
      html: '<b>Hi</b>', // html body
      auth: {
	user: config.gmail.user,
	refreshToken: config.gmail.refreshToken,
	accessToken: config.gmail.accessToken,
	expires: config.gmail.expires
      },
      attachments: [{
	filename: video_path,
	content: fs.createReadStream(video_path)
      }]
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error)
	return logger.error(error)

      logger.info('Message %s sent: %s', info.messageId, info.response)
    })
    
  })
}
