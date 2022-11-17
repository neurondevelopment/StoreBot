const express = require('express')
const app = express()
const mysql = require('mysql2')

const connection = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    database: 'store'
})

module.exports.connection = connection

app.set('views', './public/views')
app.set('view engine', 'ejs')
app.use(express.static('./public/assets/'))
app.listen('6969')

console.log('Server started on port 6969')

require('./routes')(app)