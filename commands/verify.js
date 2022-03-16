const { stripeSecretKey } = require('../config.json').storeBot
const stripe = require('stripe')(stripeSecretKey);
const paypal = require('paypal-rest-sdk')
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    perms: [],
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Check the status of a purchase you have made')
        .addStringOption((option) => option.setName('paymentid').setDescription('The payment ID to check').setRequired(true)),
    async execute(interaction) {
        const paymentID = interaction.options.get('paymentid').value
        if(!paymentID) return interaction.reply({ content: 'Invalid payment ID provided!', ephemeral: true })
        if(paymentID.startsWith('PAYID-')) {
            paypal.payment.get(paymentID, function (error, payment) {
                if (error) {
                    console.log(error);
                    throw error;
                } else {
                    interaction.reply({ content: `Current Status: ${payment.state}\nUser: <@${payment.transactions[0].custom.split('|||')[0]}> (${payment.transactions[0].custom.split('|||')[0]})\nProduct: ${payment.transactions[0].item_list.items[0].name}`, ephemeral: true })
                }
           })
        }
        else if (paymentID.startsWith('cs_')){
            const session = await stripe.checkout.sessions.retrieve(paymentID)
            if(session) {
                interaction.reply({ content: `Current Status: ${session.payment_status}\nUser: <@${session.metadata.clicker}> (${session.metadata.clicker})\nProduct: ${session.metadata.product}`, ephemeral: true })
            }
            else {
                return interaction.reply({ content: 'Invalid payment ID provided!', ephemeral: true })
            }
        }
        else {
            return interaction.reply({ content: 'Invalid payment ID provided!', ephemeral: true })
        }
    },
};