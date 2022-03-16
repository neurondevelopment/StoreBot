const Discord = require('discord.js');
const fs = require('fs')
const figlet = require('figlet');
const { token, footer } = require('./config.json');
const { stripeSecretKey, port, paypalSandboxOrLive, paypalClientSecret, paypalClientID, currency, invoiceSuccessUrl,invoiceCancelUrl, ip, invoiceUseStripe, invoiceUsePaypal, globalCustomerRoles, serverID } = require('./config.json').storeBot
const app = require('express')()
const stripe = require('stripe')(stripeSecretKey)
const { currencySymbol, paypalEmoji, stripeEmoji, ticketEmoji, openTicket, ticketMessage, buttonHideOrDisable, redirect, download } = require('./config.json').storeBot.format
const paypal = require('paypal-rest-sdk');
const events = require('./events')

paypal.configure({
    'mode': paypalSandboxOrLive, //sandbox or live
    'client_id': paypalClientID,
    'client_secret': paypalClientSecret
});

const client  = new Discord.Client({
    partials: ['CHANNEL', 'MESSAGE', "REACTION", 'GUILD_MEMBER'],
    intents: 513
});
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());  
    client.commands.set(command.data.name, command);
}

function createEmbed(info, name) {
    if(info.type === 'Ticket') {
        const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle(name)
        .setDescription(info.embed.description)
        .setThumbnail(info.embed.thumbnail)
        .setImage(info.embed.image)
        .setFooter({ text: `${info.embed.footer} - Made By Cryptonized` })
        return embed;
    }
    else {
        let features = '';
        const embed = new Discord.MessageEmbed()
            .setColor(info.embed.color)
            .setTitle(name)
            .setDescription(info.embed.description)
            .setThumbnail(info.embed.thumbnail)
            .setImage(info.embed.image)
            .setFooter({ text: `${info.embed.footer} - Made By Cryptonized` })
    
        info.embed.features.forEach(curr => {
            features += `> ${curr}\n`
        })
        embed.addField(`Features`, features, false)
    
        embed.addField(`Price`, `\`\`\`${info.productInfo.format.replace('{PRICE}', info.productInfo.price).replace('{CURRENCY}', info.productInfo.currency)}\`\`\``, true)
        embed.addField(`Date Released`, `\`\`\`${info.productInfo.releaseDate.replace('{DATE}', new Date(Date.now()).toLocaleString().split(',')[0])}\`\`\``, true)
        embed.addField(`Product Type`, `\`\`\`${info.type}\`\`\``, true)
        return embed
    }
}

function getButtons(info, name) {
    const button1 = new Discord.MessageButton()
        .setStyle("SECONDARY")
        .setEmoji(paypalEmoji)
        .setLabel("Pay With Paypal")
        .setCustomId(`NEURONpaypal_${name}`)
    const button2 = new Discord.MessageButton()
        .setStyle("SECONDARY")
        .setEmoji(stripeEmoji)
        .setLabel("Pay With Stripe")
        .setCustomId(`NEURONstripe_${name}`)
    const button3 = new Discord.MessageButton()

    if(info.type === "One-Time" && info.productInfo.downloadURL) button3.setStyle("PRIMARY").setLabel(`${download}`).setCustomId(`NEURONdownload_${name}`)
    if(info.type === "Redirect") button3.setStyle("LINK").setLabel(`${redirect}`).setURL(info.productInfo.redirectURL)
    if(info.type === "Ticket") button3.setStyle("SECONDARY").setLabel(`${openTicket}`).setEmoji(ticketEmoji).setCustomId(`NEURONticket_${info.productInfo.categoryID}`)
    let buttonRow = new Discord.MessageActionRow()
    if(buttonHideOrDisable.toLowerCase() === "hide") {
        if(info.productInfo.usePaypal && info.type === "One-Time") buttonRow.addComponents(button1)
        if(info.productInfo.useStripe && info.type === "One-Time") buttonRow.addComponents(button2)
    }
    else {
        if(!info.productInfo.usePaypal) button1.setDisabled(true)
        if(!info.productInfo.useStripe) button2.setDisabled(true)
        if(info.type === "One-Time") buttonRow.addComponents(button1, button2)
        
    }
    if(button3.style) buttonRow.addComponents(button3)
    return buttonRow
}

async function globalCustomerRole(user) {
    globalCustomerRoles.forEach(async curr => {
        const role = client.guilds.cache.get(serverID).roles.cache.get(curr)
        if(role) {
            const guild = client.guilds.cache.get(serverID)
            if(!guild) return console.log(`Invalid guild ID specified in config!`)
            const member = await guild.members.fetch(user)
            if(!member) return;
            member.roles.add(role)
        }
        else {
            console.log(`Invalid global customer role specified : ${role}`)
        }
    })
}

async function customerRoles(user, product) {
    if(!user) return;
    const info = JSON.parse(fs.readFileSync('./db/listings.json'))[product]
    info.productInfo.customerRoles.forEach(async curr => {
        const role = client.guilds.cache.get(serverID).roles.cache.get(curr)
        if(role) {
            const guild = client.guilds.cache.get(serverID)
            if(!guild) return console.log(`Invalid guild ID specified in config!`)
            const member = await guild.members.fetch(user)
            if(!member) return;
            member.roles.add(role)
        }
        else {
            console.log(`Invalid client role specified : ${role} for product : ${product}`)
        }
    })
}

async function updateListings() {
    const listings = JSON.parse(fs.readFileSync('./db/listings.json'))
    const guild = await client.guilds.fetch(serverID)
    if(!guild) return console.log(`Specified serverID ${serverID} in console could not be found by bot! Ensure the bot is in that guild and it is a valid ID!`)
    for(const a in listings) {
        const info = listings[a]
        if(info.messageID && info.channelID) {
            const channel = await guild.channels.fetch(info.channelID)
            if(channel) {
                const message = await channel.messages.fetch(info.messageID).catch(err => {})
                
                if(message) {
                    await message.edit({ embeds: [createEmbed(info,a)], components: [getButtons(info, a)]})
                }
                else { // Message does not exist, sends a new one and replaces the line in config
                    const msg = await channel.send({ embeds: [createEmbed(info,a)], components: [getButtons(info, a)] }) 
                    const file = JSON.parse(fs.readFileSync('./db/listings.json'))
                    file[a].messageID = msg.id
                    fs.writeFileSync('./db/listings.json', JSON.stringify(file, null, 4))
                    
                }
            }
            else { // Channel does not exist, does not continue and warns user
                console.log(`Channel ID for ${a} does not lead to a valid channel!`)
            } 
        }
        else if(!info.channelID) { // Message ID is set but channel isn't
            console.log(`Channel ID for ${a} not set!`)
        }
        else {
            const channel = await guild.channels.fetch(info.channelID)
            const msg = await channel.send({ embeds: [createEmbed(info,a)], components: [getButtons(info, a)]})
            const file = JSON.parse(fs.readFileSync('./db/listings.json'))
            file[a].messageID = msg.id
            fs.writeFileSync('./db/listings.json', JSON.stringify(file, null, 4))
        }
    }
}

client.on('ready', async () => {
    updateListings()
    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, serverID),
                { body: commands },
            );

            console.log('Successfully registered commands.');
        } catch (error) {
            console.error(error);
        }
    })();
    const { type, content } = require('./config.json').status

    figlet('Neuron Development', function(err, data) {
        if (err) {
            console.log(err)
            return;
        }
        console.log(`\x1b[36m%s\x1b[0m`, data)
        console.log('Started bot')
    });

    if(type && content) {
        if(type.toUpperCase() === 'PLAYING') {
            client.user.setActivity(content, { type: 'PLAYING' })
        }
        else if(type.toUpperCase() === 'WATCHING') {
            client.user.setActivity(content, { type: 'WATCHING' })
        }
        else {
            console.log('Invalid type specified for the bot\'s status')
        }
    }

    app.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const amount = req.query.price;
        const paymentId = req.query.paymentId;
        const execute_payment_json = {
          "payer_id": payerId,
          "transactions": [{
              "amount": {
                  "currency": `${currency}`,
                  "total": `${amount}`
              }
          }]
        };
      
        paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
          if (error) {
              res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
          } else {
             const channel = await client.channels.fetch(paymentLogs)

              const user = payment.transactions[0].custom.split('|||')[0]
              const mess = payment.transactions[0].custom.split('|||')[1]
              const invoice = payment.transactions[0].custom.split('|||')[2]
              const productName = payment.transactions[0].custom.split('|||')[3]
              const info = JSON.parse(fs.readFileSync('./db/listings.json'))[payment.transactions[0].custom.split('|||')[3]]
              if(channel) {
                const embed = new Discord.MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('Purchase Created')
                    .setDescription(`User <@${user}> (${user}) has just purchased \`${payment.transactions[0].item_list.items[0].name}\` for \`${parseInt(amount).toFixed(2)}\`\n\nPayment ID: ${paymentId}`)
                    .setThumbnail(channel.guild.iconURL() || `https://cdn.discordapp.com/embed/avatars/0.png`)
                    .setFooter({ text: `${footer} - Made By Cryptonized` })

                channel.send({ embeds: [embed] })
             }
              if(invoice === 'ye') {
                events.invoice(user, amount)
                let obj = {}
                let invoices = JSON.parse(fs.readFileSync('./db/invoices.json'))
                obj.status = "Paid"
                let arr = invoices[mess].client
                if(invoices[mess].client[0]) {
                    arr.push(user)
                    obj.client = arr
                }
                else {
                    obj.client = [user]
                }
                
                invoices[mess] = obj
                fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
                res.redirect(invoiceSuccessUrl);
                
              }
              else {
                events.paymentCompleted(user, productName)
                await globalCustomerRole(user)
                await customerRoles(user, productName)
                const file = JSON.parse(fs.readFileSync('./db/listings.json'))
                const newArray = file[productName].clients.push(user)
                file[productName].clients = newArray
                fs.writeFileSync('./db/listings.json', file, null, 4)
                res.redirect(file[productName].productInfo.success_url);
                
              }
              const msg = {
                to: payment.payer.payer_info.email,
                from: fromEmail,
                subject: `Payment Confirmation`,
                text: `Thank you for your recent purchase of ${payment.transactions[0].item_list.items[0].name} in ${client.guilds.cache.get(serverID).name}\n\nYour payment ID is: ${payment.id}`
                }
                if(sendEmails) {
                    sgMail
                    .send(msg)
                    .then(() => {
                        //console.log('Email sent')
                    })
                    .catch((error) => {
                        console.error(error)
                    })
                }
              
          }
      });
    });
    app.get('/stripesuccess', async (req, res) => {
    
        const sessionID = req.query.sessionID;
        if(!sessionID) {
            return res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        }
        const session = await stripe.checkout.sessions.retrieve(sessionID);
        const messageID = session.metadata.messageID;
        const clicker = session.metadata.clicker;
        const info = session.metadata.info
        const productInfo = JSON.parse(fs.readFileSync('./db/listings.json'))[info]
        const channel = await client.channels.fetch(paymentLogs)
        if(channel) {
            const embed = new Discord.MessageEmbed()
                .setColor('AQUA')
                .setTitle('New Order Created')
                .setDescription(`User <@${clicker}> (${clicker}) has just purchased \`${session.metadata.product}\` for \`${(parseInt(session.metadata.amount) / 100).toFixed(2)}\`\n\nPayment ID: ${session.id}`)
                .setThumbnail(channel.guild.iconURL() || `https://cdn.discordapp.com/embed/avatars/0.png`)
                .setFooter({ text: `${footer} - Made By Cryptonized` })

            channel.send({ embeds: [embed] })
        }
        if(session.metadata.invoice === false) {
            events.paymentCompleted(clicker, info)
            await globalCustomerRole(clicker)
            await customerRoles(clicker, info)
            const file = JSON.parse(fs.readFileSync('./db/listings.json'))
            const newArray = file[info].clients.push(clicker)
            file[productName].clients = newArray
            fs.writeFileSync('./db/listings.json', file, null, 4)
            res.redirect(productInfo.productInfo.success_url);
        }
        else {
            events.invoice(clicker, (parseInt(session.metadata.amount) / 100).toFixed(2))
            delete require.cache[require('path').resolve('./db/invoices.json')]
            let obj = {}
            let invoices = require('./db/invoices.json')
            obj.status = "Paid"
            let arr = invoices[messageID].client
            if(invoices[messageID].client[0]) {
                arr.push(clicker) 
                obj.client = arr
            } 
            else {
                obj.client = [clicker]
            }
            invoices[messageID] = obj
            fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
            res.redirect(invoiceSuccessUrl);
        }

        const msg = {
            to: session.customer_details.email,
            from: fromEmail,
            subject: `Payment Confirmation`,
            text: `Thank you for your recent purchase of ${session.metadata.product} in ${client.guilds.cache.get(serverID).name}\n\nYour payment ID is: ${sessionID}`
        }
        if(sendEmails) {
            sgMail
            .send(msg)
            .then(() => {
                //console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
        }

    });
      
    app.listen(port, () => console.log(`Running on port ${port}`));
      

})

client.on('interactionCreate', async (interaction) => {
    if(interaction.isButton()) {
        if (interaction.customId.startsWith('NEURONstripe_')) {
            const info = JSON.parse(fs.readFileSync('./db/listings.json'))[interaction.customId.split('NEURONstripe_')[1]]
            const amou = parseFloat(interaction.message.embeds[0].fields[1].value.replace(currencySymbol, '').replace(' ', '').replace(/`/g, '')).toFixed(2) * 100 
            events.paymentInitiate(interaction.user.id, interaction.customId.split('NEURONstripe_')[1], amou, 'stripe')
            if (!info) { // Not in listings database so we assume it is an invoice
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                      {
                        price_data: {
                          currency: currency,
                          product_data: {
                            name: 'Custom Invoice',
                            description: `Made By Cryptonized | Note: This product will be delivered to ${interaction.user.tag}, if this isn't you, ensure you are using your own link!`,
                            images: [`${interaction.message.guild.iconURL()}`],
                          },
                          unit_amount: amou,
                        },
                        quantity: 1,
                      },
                    ],
                    metadata: {
                        messageID: interaction.message.id,
                        clicker: interaction.user.id,
                        product: 'Custom Invoice',
                        info: interaction.customId.split('NEURONstripe_')[1],
                        amount: amou,
                        invoice: true
                    },
                    mode: 'payment',
                    allow_promotion_codes: true,
                    success_url: `http://${ip}:${port}/stripesuccess?sessionID={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${invoiceCancelUrl}`,
                  });

                interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}\n\n***Note: This invoice will be delivered to whoever is to use this link, ensure you are using your own link!***`, ephemeral: true })
            }
            else {
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
                          unit_amount: amou,
                        },
                        quantity: 1,
                      },
                    ],
                    metadata: {
                        messageID: interaction.message.id,
                        clicker: interaction.user.id,
                        product: interaction.message.embeds[0].title,
                        info: interaction.customId.split('NEURONstripe_')[1],
                        amount: amou,
                        invoice: false
                    },
                    mode: 'payment',
                    allow_promotion_codes: true,
                    success_url: `http://${ip}:${port}/stripesuccess?&sessionID={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${info.productInfo.cancel_url}`,
                  });

                if(info.clients) {
                    if (info.clients.indexOf(interaction.user.id) > -1) {
                        interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}\n\n***Note: You have already purchased this product, you may download it with the download button above!***`, ephemeral: true })
                    }
                    else {
                        interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}\n\n***Note: This product will be delivered to whoever clicked the button, so ensure you are using your own link!***`, ephemeral: true })
                    }
                }
                else {
                    interaction.reply({ content: `Your Checkout Link: ${session.url}\n\n**Payment ID**: ${session.id}\n\n***Note: This product will be delivered to whoever clicked the button, so ensure you are using your own link!***`, ephemeral: true })
                }
            }

        }
        else if(interaction.customId.startsWith('NEURONticket_')) {
            const category = interaction.customId.split('NEURONticket_')[1]
            if(!category) return interaction.reply({ content: 'Could not find a category for this product type. Please contact the bot owner to fix this!', ephemeral: true })
            interaction.message.guild.channels.create(`${interaction.user.username}`, { 
                parent: category
            }).then(chann => {
                interaction.reply({ content: `Ticket successfully created at <#${chann.id}>`, ephemeral: true})
                chann.permissionOverwrites.edit(interaction.user, {
                    VIEW_CHANNEL: true
                })
                const embed = new Discord.MessageEmbed()
                    .setColor('AQUA')
                    .setAuthor(`${interaction.user.tag}`, interaction.user.avatarURL() || 'https://cdn.discordapp.com/embed/avatars/0.png')
                    .setDescription(ticketMessage)
                    .addField('Product', `${interaction.message.embeds[0].title}`, true)
                    .setFooter(`${footer} - Made By Cryptonized`)
                chann.send({ embeds: [embed] })
            })
        }
        else if(interaction.customId.startsWith('NEURONpaypal_')) {
            
            const info = JSON.parse(fs.readFileSync('./db/listings'))[interaction.customId.split('NEURONpaypal_')[1]]
            const amou = parseFloat(interaction.message.embeds[0].fields[1].value.replace(currencySymbol, '').replace(' ', '').replace(/`/g, '')).toFixed(2)
            events.paymentInitiate(interaction.user.id, interaction.customId.split('NEURONpaypal_')[1], amou, 'paypal')
            if(!info) { // Generates info,  as listing not found so we assume it is an invoice
                const create_payment_json = {
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": `http://${ip}:${port}/success?price=${amou}`,
                        "cancel_url": invoiceCancelUrl
                    },
                    "transactions": [{
                        "item_list": {
                            "items": [{
                                "name": `Custom Invoice`,
                                "sku": "001",
                                "price": `${amou}`,
                                "currency": `${currency}`,
                                "quantity": 1
                            }]
                        },
                        "amount": {
                            "currency": `${currency}`,
                            "total": `${amou}`
                        },
                        "custom": `${interaction.user.id}|||${interaction.message.id}|||ye|||${interaction.customId.split('NEURONpaypal_')[1]}`,
                        "description": `Made By Cryptonized | Note: This product will be delivered to whoever requested the link, so ensure you are using your own link!`
                    }]
                };
                
                paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    for(let i = 0;i < payment.links.length;i++){
                        if(payment.links[i].rel === 'approval_url'){
                            interaction.reply({ content: `Your Checkout Link: ${payment.links[i].href}\n\n**Payment ID**: ${payment.id}\n\n***Note: This invoice will be delivered to whoever is to use this link, ensure you are using your own link!***`, ephemeral: true })
                        }
                    }
                }
                });
            }
            else {
                const create_payment_json = {
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": `http://${ip}:${port}/success?price=${amou}`,
                        "cancel_url": info.productInfo.cancel_url
                    },
                    "transactions": [{
                        "item_list": {
                            "items": [{
                                "name": `${interaction.message.embeds[0].title}`,
                                "sku": "001",
                                "price": `${amou}`,
                                "currency": `${currency}`,
                                "quantity": 1
                            }]
                        },
                        "amount": {
                            "currency": `${currency}`,
                            "total": `${amou}`
                        },
                        "custom": `${interaction.user.id}|||${interaction.message.id}|||na|||${interaction.customId.split('NEURONpaypal_')[1]}`,
                        "description": `Made By Cryptonized | Note: This product will be delivered to whoever requested the link, so ensure you are using your own link!`
                    }]
                };
                
                paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    for(let i = 0;i < payment.links.length;i++){
                        if(payment.links[i].rel === 'approval_url'){
                            interaction.reply({ content: `Your Checkout Link: ${payment.links[i].href}\n\n**Payment ID**: ${payment.id}\n\n***Note: This product will be delivered to whoever clicked the button, so ensure you are using your own link!***`, ephemeral: true })
                            
                        }
                    }
                }
                });
            }
        }
        else if(interaction.customId.startsWith('NEURONdownload_')) {
            const info = JSON.parse(fs.readFileSync('./db/listings.json'))[interaction.customId.split('NEURONdownload_')[1]]
            if(!info.clients) return interaction.reply({ content:'You must first purchase this product before you can download it!', ephemeral: true})
            if (info.clients.indexOf(interaction.user.id) < 0) {
                interaction.reply({ content:'You must first purchase this product before you can download it!', ephemeral: true})
            }
            else {
                interaction.reply({ content:`Your download link is: ${info.productInfo.downloadURL}`, ephemeral: true})
            }
            
        }
        else if(interaction.customId === 'NEURONrefresh') {
            const invoiceInfo = JSON.parse(fs.readFileSync('./db/invoices.json'))[interaction.message.id]
            if(!invoiceInfo) return interaction.reply({ content: 'Error! Could not find an invoice with that ID', ephemeral: true});
            const embed = interaction.message.embeds[0]
            let fields = embed.fields
            fields[0].value = invoiceInfo.status ? `\`\`\`${invoiceInfo.status}\`\`\`` : '```Unpaid```'
            fields[2].value = invoiceInfo.client[0] ? `<@${invoiceInfo.client.join('> <@')}>` : '```None```'
            interaction.message.edit({ embeds: [embed] })
            interaction.reply({ content: 'Successfully refreshed!', ephemeral: true})
            
        }
    }
    else if(interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if(!command.perms.some(currPerm => interaction.member.permissions.has(currPerm) || interaction.member.roles.cache.some(role => role.id === currPerm))) return interaction.reply({ content: `You do not have permission to run this command!`, ephemeral: true })
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
})

client.login(token)
