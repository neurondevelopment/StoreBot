const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { footer } = require('../config.json')
const { currencySymbol, currencyBeforeOrAfter, invoiceImage, paypalEmoji, stripeEmoji } = require('../config.json').storeBot.format
const { SlashCommandBuilder } = require('@discordjs/builders');
const { invoiceUseStripe, invoiceUsePaypal } = require('../config.json').storeBot
const fs = require('fs')

module.exports = {
    perms: [],
    data: new SlashCommandBuilder()
        .setName('invoice')
        .setDescription('Send a custom invoice')
        .addIntegerOption((option) => option.setName('amount').setDescription('Amount to invoice for').setRequired(true)),
    async execute(interaction) {
        const amount = interaction.options.get('amount').value

        const embed = new EmbedBuilder()
            .setTitle('Custom Invoice')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields([{ name: 'Current Status', value: '```Unpaid```', inline: true }])
            .setImage(invoiceImage)
            .setFooter({ text: `${footer} - Made By Cryptonized`, iconURL: interaction.guild.iconURL() })

        if(currencyBeforeOrAfter.toLowerCase() === 'after') {
            embed.setDescription(`A new invoice has been generated for \`${amount} ${currencySymbol}\``)
            embed.addFields([{ name: 'Total Price', value: `\`\`\`${amount} ${currencySymbol}\`\`\``, inline: true }])
        }
        else {
            embed.setDescription(`A new invoice has been generated for \`${currencySymbol}${amount}\``)
            embed.addFields([{ name: 'Total Price', value: `\`\`\`${currencySymbol}${amount}\`\`\``, inline: true }])
        }
        const button1 = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(paypalEmoji)
            .setLabel("Pay With Paypal")
            .setCustomId(`paypal/\\ND\\/invoice`)
        const button2 = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(stripeEmoji)
            .setLabel("Pay With Stripe")
            .setCustomId(`stripe/\\ND\\/invoice`)
        const button3 = new ButtonBuilder()
            .setStyle("PRIMARY")
            .setLabel("Refresh Status")
            .setCustomId(`refresh`)

        if(!invoiceUsePaypal) {
            button1.setDisabled(true)
        }
        if(!invoiceUseStripe) {
            button2.setDisabled(true)
        }
        embed.addFields([{ name: 'Client(s)', value: '```None```', inline: true }])
        
        const buttonRow = new ActionRowBuilder()
            .addComponents(button1,button2, button3)
        interaction.reply({ embeds: [embed], components: [buttonRow] })
        const mes = await interaction.fetchReply()

        let obj = {}
        let invoices = JSON.parse(fs.readFileSync('./db/invoices.json'))
        obj.status = "Unpaid"
        obj.client = []
        invoices[mes.id] = obj
        fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
        
    },
};