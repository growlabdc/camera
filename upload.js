const fs = require('fs')

const config = require('./config')
const tokens = require('./tokens')

const jsonfile = require('jsonfile')

const Logger = require('logplease')
const logger = Logger.create('uploader')

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

  jsonfile.writeFileSync('./tokens.json', {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  })
});

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
})

const upload = function() {
  const fileMetadata = {
    name: new Date().getTime() + '.png',
    parents: [ config.drive_folder_id]
  }

  const media = {
    mimeType: 'image/png',
    body: fs.createReadStream(config.image.output)
  }

  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function(err, file) {
    if (err)
      return logger.error(err)

    logger.info('File Id: ', file.id)
  })
}

module.exports = upload
