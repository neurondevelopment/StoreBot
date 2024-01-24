module.exports = {
    error: function(origin, message) {
        console.log(`\x1b[36m[${origin}]\x1b[0m \x1b[31m${message}\x1b[0m`)
    },
}