$('#discountForm').submit(function (e) {
    e.preventDefault()
    const discount = document.getElementById('discount').value
    document.getElementById('discount').value = ''
    console.log(discount)
})