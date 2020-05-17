'use strict'

var Promise = require('bluebird')
var join = Promise.join
var resolve = Promise.resolve
var fs = Promise.promisifyAll(require('fs'))
var xml2js = Promise.promisifyAll(require('xml2js'))
var iconv = require('iconv-lite')
var papaparse = require('papaparse')
const ARTICLE_ID_SPLITTER = new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) (.+)$/)
const SPECIFICATION_FREETEXT_SPLITTER = RegExp(/^([0-9]+.[0-9]+.) ([^ ]+) (.+) ([^ ]+) +([0-9]+,[0-9][0-9])$/)
var _ = require('lodash')
var moment = require('moment')
const ignoredRows =
  [ 'Kokonaissaldo',
    'Suoritus',
    'Viivästyskorko',
    'Tilinhoitomaksu',
    'ViivÃ€styskorko',
    'Saldon siirto'
  ]

resolve(process.argv.slice(2))
  .map(function (fileName) {
    var filePath = fileName
    var stat = fs.statAsync(filePath)
    var contents = fs.readFileAsync(filePath).catch(function ignore () { })
      .then((contentBuffer) => {
        return xml2js.parseStringAsync(iconv.decode(contentBuffer, 'ISO-8859-15'))
      })
    return join(stat, contents, function (stat, contents) {
      return {
        stat,
        filePath,
        fileName,
        contents
      }
    })
  })
  .filter((file) => file.contents !== undefined)
  .map(function (file) {
    let invoiceTimeStamp = file.contents.Finvoice.InvoiceDetails[0].InvoiceDate[0]._
    let row = file.contents.Finvoice.InvoiceRow
    if (row[0].ArticleIdentifier !== undefined) {
      return row
        // skips items that are not for bought items
        .filter((row) => ignoredRows.indexOf(row.ArticleIdentifier[0]) === -1)
        .map((row) => {
          let ArticleIdentifierMatch = row.ArticleIdentifier[0].match(ARTICLE_ID_SPLITTER)
          if (!ArticleIdentifierMatch) throw new Error(`'Unknown format in ArticleIdentifier ${row.ArticleIdentifier[0]}`)
          return {
            buyer: file.contents.Finvoice.BuyerPartyDetails[0].BuyerOrganisationName[0],
            seller: ArticleIdentifierMatch[4].trim(),
            city: ArticleIdentifierMatch[3],
            country: ArticleIdentifierMatch[2],
            type: ArticleIdentifierMatch[1],
            amount: parseFloat(row.RowAmount[0]._.replace(',', '.')),
            currency: row.RowAmount[0].$.AmountCurrencyIdentifier.trim(),
            card: row.ArticleName[0],
            date: moment(row.RowDeliveryDate ? row.RowDeliveryDate[0]._ : invoiceTimeStamp),
            fileName: file.fileName
          }
        })
    } else {
      let details = file.contents.Finvoice.SpecificationDetails[0]
      if (details !== undefined && details.SpecificationFreeText !== undefined) {
        return details.SpecificationFreeText
          .map((freetext) => {
            let freeTextFields = freetext.match(SPECIFICATION_FREETEXT_SPLITTER)
            if (freeTextFields == null) { return null }
            return {
              buyer: file.contents.Finvoice.BuyerPartyDetails[0].BuyerOrganisationName[0],
              seller: freeTextFields[3].trim(),
              city: freeTextFields[4],
              country: '',
              type: freeTextFields[2],
              amount: parseFloat(freeTextFields[5].replace(',', '.')),
              currency: 'EUR',
              card: '',
              date: freeTextFields[1] ? moment(freeTextFields[1], 'DD.MM.') : moment(invoiceTimeStamp),
              fileName: file.fileName
            }
          })
          .filter((row) => (row != null))
      }
    }
  })
  .then((data) => {
    data = _.flatten(data)
    data.sort((a, b) => {
      return moment.utc(a.date).diff(moment.utc(b.date))
    })

    data = data
      .map((row) => {
        // row.date = formatSimpleDate(row.date)
        return row
      })
      .map((row) => [row.date.format('DD.MM.YYYY'), row.type, row.currency, row.amount, row.buyer, row.seller, row.country, row.city, row.card, row.fileName])

    data.unshift(['date', 'type', 'currency', 'amount', 'buyer', 'seller', 'country', 'city', 'card', 'fileName'])

    data = papaparse.unparse(data)
    // console.log(JSON.stringify(data, null, '  '))
    console.log(data)
  })
  .catch((err) => console.log(err))
