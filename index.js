const Discord = require('discord.js');
const { Routes, EmbedBuilder, ButtonBuilder, ButtonStyle, InteractionType, ActivityType } = require('discord.js')
const fs = require('fs')
const figlet = require('figlet');
const { token, footer } = require('./config.json');
const { stripeSecretKey, port, paypalSandboxOrLive, paypalClientSecret, paypalClientID, currency, invoiceSuccessUrl, globalCustomerRoles, serverID } = require('./config.json').storeBot
const { fromEmail, sendgridApiKey, sendEmails } = require('./config.json').storeBot.email
const app = require('express')()
const stripe = require('stripe')(stripeSecretKey)
const sgMail = require('@sendgrid/mail')
if(sendEmails) {
    sgMail.setApiKey(sendgridApiKey)
}
const { paypalEmoji, stripeEmoji, ticketEmoji, openTicket, buttonHideOrDisable, redirect, download } = require('./config.json').storeBot.format
const paypal = require('paypal-rest-sdk');
const events = require('./events')
const { error } = require('./utils')
let mainGuild;

paypal.configure({
    'mode': paypalSandboxOrLive, //sandbox or live
    'client_id': paypalClientID,
    'client_secret': paypalClientSecret
});

const client  = new Discord.Client({
    intents: 513
});
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

process.on('unhandledRejection', (reason, promise) => {
    const pr = Promise.resolve(promise);
    console.log(`Unhandled Rejection at: ${reason.stack || reason} | ${pr}`);

});

const { REST } = require('@discordjs/rest');

const commands = [];

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());  
    client.commands.set(command.data.name, command);
}

function createEmbed(info, name) {
    const embed = new EmbedBuilder()
        .setColor(info.embed.color)
        .setTitle(name)
        .setDescription(info.embed.description)
        .setThumbnail(info.embed.thumbnail)
        .setImage(info.embed.image)
        .setFooter({ text: `${info.embed.footer} - Made By Cryptonized` })
    if(info.type === 'Ticket') return embed;

    embed.addFields([
        { name: `Features`, value: info.embed.features.map(f => `> ${f}\n`), inline: false },
        { name: `Price`, value: `\`\`\`${info.productInfo.format.replace('{PRICE}', info.productInfo.price).replace('{CURRENCY}', info.productInfo.currency)}\`\`\``, inline: true },
        { name: `Date Released`, value: `\`\`\`${info.productInfo.releaseDate.replace('{DATE}', new Date(Date.now()).toLocaleString().split(',')[0])}\`\`\``, inline: true },
        { name: `Product Type`, value: `\`\`\`${info.type}\`\`\``, inline: true}
    ])
    return embed
    
}

function getButtons(info, name) {
    const button1 = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(paypalEmoji)
        .setLabel("Pay With Paypal")
        .setCustomId(`paypal/\\ND\\/${name}`)
    const button2 = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(stripeEmoji)
        .setLabel("Pay With Stripe")
        .setCustomId(`stripe/\\ND\\/${name}`)
    const button3 = new ButtonBuilder()

    if(info.type === "One-Time" && info.productInfo.downloadURL) button3.setStyle(ButtonStyle.Primary).setLabel(`${download}`).setCustomId(`download_${name}`)
    if(info.type === "Redirect") button3.setStyle(ButtonStyle.Link).setLabel(`${redirect}`).setURL(info.productInfo.redirectURL)
    if(info.type === "Ticket") button3.setStyle(ButtonStyle.Secondary).setLabel(`${openTicket}`).setEmoji(ticketEmoji).setCustomId(`ticket_${info.productInfo.categoryID}`)
    let buttonRow = new ActionRowBuilder()
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

function sendEmail(emailAddress, productName, serverID, paymentID) {
    const msg = {
        to: emailAddress,
        from: fromEmail,
        subject: `Payment Confirmation`,
        text: `Thank you for your recent purchase of ${productName} in ${mainGuild.name}\n\nYour payment ID is: ${paymentID}`
    }
    if(sendEmails) {
        sgMail
        .send(msg)
        .catch((error) => {
            console.error(error)
        })
    }
}

async function globalCustomerRole(user) {
    globalCustomerRoles.forEach(async curr => {
        const role = await mainGuild.roles.fetch(curr).catch(err => { })
        if(role) {
            const member = await mainGuild.members.fetch(user)
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
        const role = await mainGuild.roles.fetch(curr).catch(err => { })
        if(role) {
            const member = await mainGuild.members.fetch(user)
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
    for(const listing in listings) {
        const info = listings[listing]
        if(info.messageID && info.channelID) {
            const channel = await mainGuild.channels.fetch(info.channelID)
            if(channel) {
                const message = await channel.messages.fetch(info.messageID).catch(err => {})
                
                if(message) {
                    await message.edit({ embeds: [createEmbed(info,listing)], components: [getButtons(info, listing)]})
                }
                else { // Message does not exist, sends a new one and replaces the line in config
                    const msg = await channel.send({ embeds: [createEmbed(info,listing)], components: [getButtons(info, listing)] }) 
                    const file = JSON.parse(fs.readFileSync('./db/listings.json'))
                    file[listing].messageID = msg.id
                    fs.writeFileSync('./db/listings.json', JSON.stringify(file, null, 4))
                    
                }
            }
            else { // Channel does not exist, does not continue and warns user
                console.log(`Channel ID for ${listing} does not lead to a valid channel!`)
            } 
        }
        else if(!info.channelID) { // Message ID is set but channel isn't
            console.log(`Channel ID for ${listing} not set!`)
        }
        else {
            const channel = await mainGuild.channels.fetch(info.channelID)
            const msg = await channel.send({ embeds: [createEmbed(info,listing)], components: [getButtons(info, listing)]})
            const file = JSON.parse(fs.readFileSync('./db/listings.json'))
            file[listing].messageID = msg.id
            fs.writeFileSync('./db/listings.json', JSON.stringify(file, null, 4))
        }
    }
}

async function checkVersion() {
    const bot = 'StoreBot'
    const req = await undici.request(`https://raw.githubusercontent.com/development/${bot}/main/package.json`)
    const data = await req.body.json()
    if(data.version > require('./package.json').version) {
        console.log('\x1b[33m%s\x1b[0m', `New version available, please update to v${data.version} at https://github.com/development/${bot}`)
    }
}

setInterval(() => {
    checkVersion()
}, 300000)

client.on('ready', async () => {
    console.log('Please note, you are currently using the staging version of StoreBot, this is not recommended for production use and some features may not work / be unstable.')
    mainGuild = await client.guilds.fetch(serverID)
    if(!mainGuild) return error('index.js', 'Invalid serverID specified in config!')
    updateListings()
    const rest = new REST({ version: '10' }).setToken(token);

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
            return console.log(err)
        }
        console.log(`\x1b[36m%s\x1b[0m`, data)
        console.log('Started bot')
    });

    if(type && content) {
        if(!ActivityType[type]) return error('Bot Status Config', `Invalid activity type: ${type}`)
        client.user.setActivity(content, { type: ActivityType[type] })
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
                const channel = await client.channels.fetch(paymentLogs).catch(err => { })

                const { userID, messageID, invoice, productName } = payment.transactions[0].custom  
                if(channel) {
                    const embed = new EmbedBuilder()
                        .setColor('Aqua')
                        .setTitle('Purchase Created')
                        .setDescription(`User <@${userID}> (${userID}) has just purchased \`${payment.transactions[0].item_list.items[0].name}\` for \`${parseInt(amount).toFixed(2)}\`\n\nPayment ID: ${paymentId}`)
                        .setThumbnail(channel.guild.iconURL() || `https://cdn.discordapp.com/embed/avatars/0.png`)
                        .setFooter({ text: `${footer} - Made By Cryptonized` })

                    channel.send({ embeds: [embed] })
                }
                if(invoice) {
                    events.invoice(userID, amount)
                    let obj = {}
                    let invoices = JSON.parse(fs.readFileSync('./db/invoices.json'))
                    obj.status = "Paid"
                    let arr = invoices[messageID].client
                    if(invoices[messageID].client[0]) {
                        arr.push(userID)
                        obj.client = arr
                    }
                    else {
                        obj.client = [userID]
                    }
                    
                    invoices[messageID] = obj
                    fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
                    res.redirect(invoiceSuccessUrl);
                    
                }
                else {
                    events.paymentCompleted(userID, productName)
                    await globalCustomerRole(userID)
                    await customerRoles(userID, productName)
                    const file = JSON.parse(fs.readFileSync('./db/listings.json'))
                    const newArray = file[productName].clients.push(userID)
                    file[productName].clients = newArray
                    fs.writeFileSync('./db/listings.json', file, null, 4)
                    res.redirect(file[productName].productInfo.success_url);
                    
                }

                sendEmail(payment.payer.payer_info.email, payment.transactions[0].item_list.items[0].name, serverID, payment.id)
              
          }
      });
    });
    app.get('/stripesuccess', async (req, res) => {
        const sessionID = req.query.sessionID;
        if(!sessionID) {
            return res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        }
        const session = await stripe.checkout.sessions.retrieve(sessionID);
        const { messageID, userID, productName, invoice, amount } = session.metadata
        const productInfo = JSON.parse(fs.readFileSync('./db/listings.json'))[productName]
        const channel = await client.channels.fetch(paymentLogs).catch(err => { })
        if(channel) {
            const embed = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle('New Order Created')
                .setDescription(`User <@${userID}> (${userID}) has just purchased \`${session.metadata.product}\` for \`${(parseInt(amount) / 100).toFixed(2)}\`\n\nPayment ID: ${session.id}`)
                .setThumbnail(channel.guild.iconURL())
                .setFooter({ text: `${footer} - Made By Cryptonized` })

            channel.send({ embeds: [embed] })
        }
        if(!invoice) {
            events.paymentCompleted(userID, info)
            await globalCustomerRole(userID)
            await customerRoles(userID, info)
            const file = JSON.parse(fs.readFileSync('./db/listings.json'))
            const newArray = file[info].clients.push(userID)
            file[productName].clients = newArray
            fs.writeFileSync('./db/listings.json', file, null, 4)
            res.redirect(productInfo.productInfo.success_url);
        }
        else {
            events.invoice(userID, (parseInt(session.metadata.amount) / 100).toFixed(2))
            let obj = {}
            let invoices = JSON.parse(fs.readFileSync('./db/invoices.json'))
            obj.status = "Paid"
            let arr = invoices[messageID].client
            if(invoices[messageID].client[0]) {
                arr.push(userID) 
                obj.client = arr
            } 
            else {
                obj.client = [userID]
            }
            invoices[messageID] = obj
            fs.writeFileSync('./db/invoices.json', JSON.stringify(invoices))
            res.redirect(invoiceSuccessUrl);
        }

        sendEmail(session.customer_details.email, productName, serverID, sessionID)

    });
      
    app.listen(port, () => console.log(`Running on port ${port}`));
})

client.on('interactionCreate', async (interaction) => {
    if(interaction.type === InteractionType.ApplicationCommand) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if(command.perms[0] && !command.perms.some(currPerm => interaction.member.permissions.has(currPerm) || interaction.member.roles.cache.some(role => role.id === currPerm))) return interaction.reply({ content: `You do not have permission to run this command!`, ephemeral: true })
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
    else {
        let args = []
        let customId = interaction.customId
        if(interaction.customId.includes('/\\ND\\/')) {
            customId = customId.split('/\\ND\\/')[0]
            args = interaction.customId.split('/\\ND\\/')
            args.shift() // Remove the actual ID
        }
        const interactionFile = require(`./interactions/${InteractionType[interaction.type]}/${customId}`)
        interactionFile.execute(interaction, args, logChann)
    }
})

client.login(token)
