var products = [
    {
        "id": 1,
        "name": "B",
        "price": 123,
        "rating": 4
    },
    {
        "id": 2,
        "name": "A",
        "price": 100,
        "rating": 4
    },
    {
        "id": 3,
        "name": "AA",
        "price": 12,
        "rating": 5
    },
    
]

function sortAZ() {
    const p = products.sort((a, b) => {
        return a.name > b.name ? 1 : -1
    })
    showProducts(p)
}

function sortZA() {
    const p = products.sort((a, b) => {
        return a.name < b.name ? 1 : -1
    })
    showProducts(p)
}

function sortLH() {
    const p = products.sort((a, b) => {
        return a.price > b.price ? 1 : -1
    })
    showProducts(p)
}

function sortHL() {
    const p = products.sort((a, b) => {
        return a.price < b.price ? 1 : -1
    })
    showProducts(p)
}

function sortRating() {
    const p = products.sort((a, b) => {
        return a.rating < b.rating ? 1 : -1
    })
    showProducts(p)
}

function showProducts(p) {
    var holder = document.getElementById('productHolder')
    holder.innerHTML = ''
    p.forEach(product => {
        const el = document.createElement('div')
        el.classList.add('card', 'text-center', 'text-bg-dark', 'productCard')
        el.id = product.id

        const innerHTML = `<img class="imgPlaceholder" src="">
        <div class="card-body">
          <h5 class="card-title"><a href="#" style="color: inherit; text-decoration: none">${product.name}</a></h5>
          <div class="stars">${('<i class="fa-solid fa-star yellow"></i>').repeat(product.rating)}</div>
          <p>£${product.price}</p>
          <a href="#" style="justify-content: center" class="btn btn-outline-info">View Info</a>
          <a href="#" style="justify-content: center" class="btn btn-outline-light">Add to Cart</a>
        </div>`
        el.innerHTML = innerHTML


        holder.appendChild(el)
    })
}

$(document).ready(function() {
    showProducts(products)

    var allCategories = document.querySelectorAll('*[id^="category"]')
    allCategories.forEach(category => {
        category.addEventListener('click', function() {
            if(!this.id.endsWith('check')) {
                document.getElementById(`${category.id}check`).checked = !document.getElementById(`${category.id}check`).checked
            }
            else {
                this.checked = !this.checked
            }
        })
    })
})

$('#search').keyup(function(e) {
    const p = products.filter(product => product.name.toLowerCase().includes(this.value.toLowerCase()))
    showProducts(p)
})

/* ON PAGE LOAD:
    - Get products from storage
    - Calculate price 
    - Show products
*/

/* ON REMOVE:
    - Remove product from storage
    - Calculate price
    - Show products
*/

/* ON DISCOUNT CODE:
    - Post request to check if code is valid
    - If valid, apply discount
    - If invalid, show error
*/

/* ON PAY:
    - Get all products in cart
    - Send post request with products and any discount code
    - Calculate total price
    - Send to payment page for processor
*/