const Discord = require('discord.js');
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
        function checkUser(id) {
            let a = false;
            const user = interaction.guild.members.cache.get(id);
            const all = perms.split(',')
            all.forEach(curr => {
                if(user.roles.cache.find(r => r.id === curr) || !curr) {
                    a = true;
                }
            })
            return a;
        }

        if(checkUser(interaction.user.id) !== true) return interaction.reply({ content: 'You do not have permission to run this command', ephemeral: true })
        const amount = interaction.options.get('amount').value

        const embed = new Discord.MessageEmbed()
            .setColor()
            .setTitle('New Invoice Created')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addField('Current Status', '```Unpaid```', true)
            .setImage(invoiceImage)
            .setFooter({ text: `${footer} - Made By Cryptonized`, iconURL: interaction.guild.iconURL() })

        if(currencyBeforeOrAfter.toLowerCase() === 'after') {
            embed.setDescription(`A new invoice has been generated for \`${amount} ${currencySymbol}\``)
            embed.addField('Total Price', `\`\`\`${amount} ${currencySymbol}\`\`\``, true)
        }
        else {
            embed.setDescription(`A new invoice has been generated for \`${currencySymbol}${amount}\``)
            embed.addField('Total Price', `\`\`\`${currencySymbol}${amount}\`\`\``, true)
        }
        const button1 = new Discord.MessageButton()
            .setStyle("SECONDARY")
            .setEmoji(paypalEmoji)
            .setLabel("Pay With Paypal")
            .setCustomId(`NEURONpaypal_invoice`)
        const button2 = new Discord.MessageButton()
            .setStyle("SECONDARY")
            .setEmoji(stripeEmoji)
            .setLabel("Pay With Stripe")
            .setCustomId(`NEURONstripe_invoice`)
        const button3 = new Discord.MessageButton()
            .setStyle("PRIMARY")
            .setLabel("Refresh Status")
            .setCustomId(`NEURONrefresh`)

        if(!invoiceUsePaypal) {
            button1.setDisabled(true)
        }
        if(!invoiceUseStripe) {
            button2.setDisabled(true)
        }
        embed.addField('Client(s)', '```None```', true)
        
        const buttonRow = new Discord.MessageActionRow()
            .addComponents(button1,button2, button3)
        interaction.reply({ embeds: [embed], components: [buttonRow] })
        const mes = await interaction.fetchReply()

        let obj = {}
        let invoices = JSON.parse(fs.readFileSync('../db/invoices.json'))
        obj.status = "Unpaid"
        obj.client = []
        invoices[mes.id] = obj
        fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
        
    },
};