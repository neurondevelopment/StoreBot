<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <img src="https://cdn.discordapp.com/attachments/849289892068065310/954062297003860028/logo.png" alt="Logo" width="80" height="80">

  <h3 align="center">Store Bot</h3>

  <p align="center">
    Highly automated bot, to handle and fulfill sales, with both stripe and paypal integration, users can purchase your products with automatic delivery.
    <br />
    <br />
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

The store bot was created to simplify the checkout process for customers, as well as providing a unique way to sell products to your clients, including invoicing, logging, paypal & stripe integration, a ticket system, and much more. It is completely free to use, and we hope it will greatly help out many users.

Some of the features:
* Stripe & Paypal Integration
* Easy to use configuration system
* Custom Invoicing
* Support for tickets & redirects
* Automatic delivery of products on purchase
* Logging & events system for developers

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* NodeJS >= v16.13.0
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo or download the files
   ```sh
   git clone https://github.com/neurondevelopment/CoreBot.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Fill in the information in `config.json`, the following fields are required for the bot to start
   ```js
   token serverID
   ```
4. Fill in the appropriate payment processor API keys ([stripe](https://dashboard.stripe.com/apikeys) & [paypal](https://developer.paypal.com/developer/applications))
5. Invite or reinvite the bot with the following link, replace YOURCLIENTID with the Client ID of your bot
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOURCLIENTID&permissions=8&scope=applications.commands%20bot
   ```
6. Starting the bot
   ```sh
   node .
   ```
   **OR**
   
   ```sh
   node index.js
   ```

### Creating Listings

Listings can be found in /db/listings.json

```js
"Listing 1": {
        "type": "One-Time", // One-Time | Redirect | Ticket
        "channelID": "", // Channel ID for the embed to be sent to, must be set for the listing to show up.
        "messageID": "", // Message ID of embed will be automatically set by the bot
        "embed": {
            "colour": "RANDOM",
            "description": "New Listing", // Description of listing
            "features": [ // Features, separate each feature in the array
                "Feature 1",
                "Feature 2"
            ],
            "thumbnail": "", // Thumbnail image (optional) will display a square image in top-right of embed (provide a link)
            "image": "", // Main image (optional) will display a larger image at the bottom of the embed (provide a link)
            "footer": "Neuron Development" // Text at bottom of embed
        },
        "productInfo": {
            "price": "5", // The price of the product, will show up in the embed and also change the price in paypal / stripe
            "currency": "£", // For the embed, doesn't affect the actual price of the product
            "releaseDate": "{DATE}", // Enter date or use {DATE} to use current date
            "usePaypal": true, // Enable use of paypal, set to (true) or (false)
            "useStripe": true, // Enable use of stripe, set to (true) or (false)
            "success_url": "https://youtube.com/yes", // Where to redirect the user after a successful purchase
            "cancel_url": "https://youtube.com", // Where to redirect the user if they cancel a purchase
            "format": "{CURRENCY} {PRICE}", // How the price will be displayed in the embed use {CURRENCY} and {PRICE}
            "customerRoles": [], // Roles to give to the customer after purchasing. (Will also add global customer roles set in main config)
            "redirectURL": "", // URL to redirect to, only applicable if using (Redirect) type
            "downloadURL": "", // Download link to provide to customers, only applicable if using (One-Time) type. Leave blank to disable download button
            "categoryID": "" // Category ID for tickets to be sent to, only applicable if using (Ticket) type
        },
        "clients": [] // Will be automatically set by bot, but can also be manually changed if required. It just uses the user's IDs in an array.
    } 
```
<br>

### SendGrid API

Some users may chose to use the SendGrid API to send customers an email after completing a purchase.

Ensure you have an account setup and then follow the steps below.

1. First head [here](https://app.sendgrid.com/settings/sender_auth) and then either use domain authentication (if you own a domain) which I would recommend, or you can just use Single Sender Verification. You may have to use the second if you don't own a domain.
2. Next head to [this link](https://app.sendgrid.com/settings/api_keys) and then create an API key and give it full access, then copy that API key into your config.json
3. In your config.json you will find a section called fromEmail, in here you can set the address that the email will come from, if you previously authenticated the domain (in the first step) example.com you could use store@example.com as an example, but you can change store to whatever you wish




<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/neurondevelopment/StoreBot.svg?style=for-the-badge
[contributors-url]: https://github.com/neurondevelopment/StoreBot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/neurondevelopment/StoreBot.svg?style=for-the-badge
[forks-url]: https://github.com/neurondevelopment/StoreBot/network/members
[stars-shield]: https://img.shields.io/github/stars/neurondevelopment/StoreBot.svg?style=for-the-badge
[stars-url]: https://github.com/neurondevelopment/StoreBot/stargazers
[issues-shield]: https://img.shields.io/github/issues/neurondevelopment/StoreBot.svg?style=for-the-badge
[issues-url]: https://github.com/neurondevelopment/StoreBot/issues
[license-shield]: https://img.shields.io/github/license/neurondevelopment/StoreBot.svg?style=for-the-badge
[license-url]: https://github.com/neurondevelopment/StoreBot/blob/main/LICENSE

