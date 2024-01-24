const { EmbedBuilder, ChannelType } = require('discord.js')
const { ticketMessage } = require('../../config.json').storeBot.format

module.exports = {
    name: 'ticket',
    async execute(interaction, args) {
        if(!args[0]) return interaction.reply({ content: 'Could not find a category for this product type.', ephemeral: true })
        const channel = await interaction.message.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: args[0]
        }).catch(err => {
            console.log(err)
            return interaction.reply({ content: 'Failed to create a ticket channel.', ephemeral: true })
        })

        await chann.permissionOverwrites.edit(interaction.user, {
            ViewChannel: true
        })

        const embed = new EmbedBuilder()
            .setColor('Aqua')
            .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(ticketMessage)
            .addFields([{ name: 'Product', value: `${interaction.message.embeds[0].title}` }])
            .setFooter({ text: `${footer} - Made By Cryptonized` })

        await channel.send({ embeds: [embed] }).catch(err => { console.log(err) })

        await interaction.reply({ content: `Ticket successfully created at <#${channel.id}>`, ephemeral: true})
    }
}