const path = require('path')

module.exports = {
  port: 8081,
  image_path: path.resolve(__dirname, 'image.png'),
  capture_interval: 10 * 1000,
  upload_interval: 10 * 60 * 1000,
  image: {
    width: 1920,
    height: 1200,
    encoding: 'png'
  },
  clientId: '',
  clientSecret: '',
  redirectUrl: '',
  drive_folder_id: ''
}
