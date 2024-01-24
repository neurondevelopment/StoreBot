module.exports = {
    name: 'refresh',
    async execute(interaction, args) {
        const invoiceInfo = JSON.parse(fs.readFileSync('../../db/invoices.json'))[interaction.message.id]
        if(!invoiceInfo) return interaction.reply({ content: 'Error! Could not find an invoice with that ID', ephemeral: true});
        const embed = interaction.message.embeds[0]
        let fields = embed.fields
        fields[0].value = `\`\`\`${invoiceInfo.status || 'Unpaid'}\`\`\``
        fields[2].value = invoiceInfo.client[0] ? `<@${invoiceInfo.client.join('> <@')}>` : '```None```'
        await interaction.message.edit({ embeds: [embed] })
        interaction.reply({ content: 'Successfully refreshed!', ephemeral: true})
    }
}