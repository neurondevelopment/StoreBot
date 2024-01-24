const { ip, port, invoiceCancelUrl } = require('../../config.json').storeBot
const { currencySymbol } = require('../../config.json').storeBot.format

module.exports = {
    name: 'paypal',
    async execute(interaction, args) {
        const info = JSON.parse(fs.readFileSync('../../db/listings.json'))[args[0]]
        const amount = parseFloat(interaction.message.embeds[0].fields[1].value.replace(currencySymbol, '').replace(' ', '').replace(/`/g, '')).toFixed(2)
        events.paymentInitiate(interaction.user.id, args[0], amount, 'paypal')
        const customObj = {
            "userID": interaction.user.id,
            "messageID": interaction.message.id,
            "invoice": false,
            "productName": args[0]
        }

        let cancelUrl = invoiceCancelUrl
        if(!info) customObj['invoice'] = true;
        if(info) cancelUrl = info.productInfo.cancel_url

        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": `http://${ip}:${port}/success?price=${amount}`,
                "cancel_url": info.productInfo.cancel_url
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": `${interaction.message.embeds[0].title}`,
                        "sku": "001",
                        "price": `${amount}`,
                        "currency": `${currency}`,
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": `${currency}`,
                    "total": `${amount}`
                },
                "custom": `${JSON.stringify(customObj)}`,
                "description": `Made By Cryptonized | Note: This product will be delivered to ${interaction.user.username}, if this isn't you, ensure you are using your own link`
            }]
        };
        
        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                const approvalUrl = payment.links.filter(link => link.rel === 'approval_url')[0].href
                if(!approvalUrl) return interaction.reply({ content: `Failed to fetch the approval URL`, ephemeral: true })
                if(info && info.clients && info.clients.indexOf(interaction.user.id) > -1) {
                    interaction.reply({ content: `Your Checkout Link: ${approvalUrl}\n\n**Payment ID**: ${payment.id}\n\n***Note: You have already purchased this product, you may download it with the download button above!***`, ephemeral: true })
                }
                else {
                    interaction.reply({ content: `Your Checkout Link: ${approvalUrl}\n\n**Payment ID**: ${payment.id}`, ephemeral: true })
                }
            }
        });
    }
}