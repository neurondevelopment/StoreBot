const { ip, port, invoiceCancelUrl } = require('../../config.json').storeBot
const { currencySymbol } = require('../../config.json').storeBot.format

module.exports = {
    name: 'stripe',
    async execute(interaction, args) {
        const info = JSON.parse(fs.readFileSync('../../db/listings.json'))[args[0]]
        const amount = parseFloat(interaction.message.embeds[0].fields[1].value.replace(currencySymbol, '').replace(' ', '').replace(/`/g, '')).toFixed(2) * 100 
        events.paymentInitiate(interaction.user.id, args[0], amount, 'stripe')
        const customObj = {
            "userID": interaction.user.id,
            "messageID": interaction.message.id,
            "invoice": false,
            "amount": amount,
            "productName": args[0]
        }

        let cancelUrl = invoiceCancelUrl;
        if(!info) customObj['invoice'] = true;
        if(info) cancelUrl = info.productInfo.cancel_url;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: currency,
                  product_data: {
                    name: interaction.message.embeds[0].title,
                    description: `Made By Cryptonized | Note: This product will be delivered to ${interaction.user.tag}, if this isn't you, ensure you are using your own link!`,
                    images: [`${interaction.message.guild.iconURL()}`],
                  },
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            metadata: customObj,
            mode: 'payment',
            allow_promotion_codes: true,
            success_url: `http://${ip}:${port}/stripesuccess?&sessionID={CHECKOUT_SESSION_ID}`,
            cancel_url: `${info.productInfo.cancel_url}`,
          });

        if(info && info.clients && info.clients.indexOf(interaction.user.id) > -1) {
            interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}\n\n***Note: You have already purchased this product, you may download it with the download button above!***`, ephemeral: true })
        }
        else {
            interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}`, ephemeral: true })
        }
    }
}