const { connection } = require('./index')
const markdown = require('markdown-it')
const md = new markdown()

module.exports = function(app) {
    app.get('/', function (req, res) {
        res.render('home.ejs')
    })

    app.get('/product/:id', function (req, res) {
        const desc = 'me when some'
        const description = md.render(desc)
        res.render('product.ejs', { description })
    })
    app.get('/cart', function(req, res) {
        res.render('cart.ejs')
    })
    app.post('/checkDiscount', function (req, res) {
        const discount = req.body.discount
    })
}