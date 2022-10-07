const { EmbedBuilder } = require('discord.js')
const { ticketMessage } = require('../../config.json').storeBot.format

module.exports = {
    name: 'ticket',
    async execute(interaction, args) {
        if(!args[0]) return interaction.reply({ content: 'Could not find a category for this product type.', ephemeral: true })
        interaction.message.guild.channels.create(`${interaction.user.username}`, { 
            parent: args[0]
        }).then(channel => {
            interaction.reply({ content: `Ticket successfully created at <#${channel.id}>`, ephemeral: true})
            chann.permissionOverwrites.edit(interaction.user, {
                ViewChannel: true
            })
            const embed = new EmbedBuilder()
                .setColor('Aqua')
                .setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(ticketMessage)
                .addFields([{ name: 'Product', value: `${interaction.message.embeds[0].title}` }])
                .setFooter({ text: `${footer} - Made By Cryptonized` })
            channel.send({ embeds: [embed] })
        })
    }
}