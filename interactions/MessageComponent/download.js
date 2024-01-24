module.exports = {
    name: 'download',
    async execute(interaction, args) {
        const info = JSON.parse(fs.readFileSync('./db/listings.json'))[args[0]]
        if(!info.clients) return interaction.reply({ content:'You must first purchase this product before you can download it!', ephemeral: true})
        if (info.clients.indexOf(interaction.user.id) < 0) {
            interaction.reply({ content:'You must first purchase this product before you can download it!', ephemeral: true})
        }
        else {
            interaction.reply({ content:`Your download link is: ${info.productInfo.downloadURL}`, ephemeral: true})
        }
    }
}