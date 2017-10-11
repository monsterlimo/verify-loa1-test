;(function () {
  var monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  var d = new Date()

  d.setMonth(d.getMonth() - 6)
  var day = d.getDate()
  var year = d.getFullYear()
  var monthIndex = d.getMonth()
  var sixAgo = document.getElementsByClassName('6MonthsAgo')
  if (sixAgo.length) {
    sixAgo[0].innerHTML = day + ' ' + monthNames[monthIndex] + ' ' + year
    sixAgo[1].innerHTML = (day + 1) + ' ' + monthNames[monthIndex] + ' ' + year
  }

  d.setMonth(d.getMonth() - 18)
  var day = d.getDate()
  var year = d.getFullYear()
  var monthIndex = d.getMonth()
  var eighteenAgo = document.getElementsByClassName('18MonthsAgo')
  var overEighteenAgo = document.getElementsByClassName('over18MonthsAgo')
  if (eighteenAgo.length) {
    eighteenAgo[0].innerHTML = day + ' ' + monthNames[monthIndex] + ' ' + year
  }
  if (overEighteenAgo.length) {
    overEighteenAgo[0].innerHTML = (day + 1) + ' ' + monthNames[monthIndex] + ' ' + year
  }
}).call(this)
