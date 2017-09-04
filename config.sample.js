const path = require('path')

module.exports = {
  port: 8081,
  capture_interval: 10 * 1000,
  upload_interval: 10 * 60 * 1000,
  image: {
    mode: 'photo',
    hflip: false,
    width: 1920,
    height: 1200,
    output: path.resolve(__dirname, 'image.png'),
    encoding: 'png',
    timeout: 0
  },
  clientId: '',
  clientSecret: '',
  redirectUrl: '',
  drive_folder_id: '',
  gmail: {
    user: '',
    to: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    accessToken: '',
    expires: null
  }  
}
