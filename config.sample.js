const path = require('path')

module.exports = {
  port: 8081,
  image_path: path.resolve(__dirname, 'image.png'),
  capture_interval: 1000,
  upload_interval: 10 * 60 * 1000,
  image: {
    width: null,
    height: null,
    encoding: 'png'
  },
  clientId: '',
  clientSecret: '',
  redirectUrl: '',
  drive_folder_id: ''
}
