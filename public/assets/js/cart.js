$('#discountForm').submit(function (e) {
    e.preventDefault()
    const discount = document.getElementById('discount').value
    document.getElementById('discount').value = ''
    console.log(discount)

    $.ajax({
        url: '/checkDiscount',
        type: 'POST',
        data: { discount },
        success: function (res) {
            if (res.error) {
                console.log(res.error)
            } else {
                console.log(res)
            }
        }
    })
})