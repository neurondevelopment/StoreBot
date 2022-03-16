module.exports = {
    paymentInitiate: function(user, product, amount, paymentType) {
        // Triggered when user clicks Pay with Stripe / Paypal. Note this does not mean the user has purchased anything yet.
        // 'user' = user ID; 'product' = the name of the product; 'amount' = amount payment is worth; 'paymentType' = stripe or paypal
        
        console.log(`Payment Initiated: ${user} is interested in ${product} for ${amount} and has clicked on ${paymentType}`)
    },
    paymentCompleted: function(customer, product) {
        // Will be triggered when a purchase has been made. 
        //'customer' = the discord ID of the customer; 'product' = the name of the product
        
        console.log(`Payment Completed: ${customer} purchased \n${product}`) //
    },
    invoice: function(customer, amount) {
        // Will be triggered when an invoice is paid. 
        //'customer' = discord ID of customer; 'amount' = amount paid
        
        console.log(`${customer} has just paid an invoice for ${amount}`)
    }
}