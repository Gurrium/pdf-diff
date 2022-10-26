function main() {
  const targetUrl = PropertiesService.getScriptProperties().getProperty('TARGET_URL')
  
  const response = UrlFetchApp.fetch(targetUrl)
  const pdfBlob = response.getBlob()

  // pdf to text
  const gdocFile = Drive.Files.insert(
    {
      title: 'tmp.gdoc',
      mimeType: pdfBlob.getContentType()
    },
    pdfBlob,
    {
      ocr: true,
      ocrLanguage: 'ja'
    }
  )  
  const text = DocumentApp.openById(gdocFile.id).getBody().getText()

  // delete tmp gdoc
  Drive.Files.remove(gdocFile.id)

  // extract services
  var abjServices = {}
  const matched = text.matchAll(/(ABJ \d+)\s((?:(?!ABJ).)*)/g)
  Array.from(matched).forEach(([, abjID, service]) => {
    abjServices[abjID] = service
  })

  // save services
  const fileName = jsonFileName(new Date())
  const servicesJson = Drive.Files.insert(
    {
      title: fileName,
      mimeType: MimeType.PLAIN_TEXT
    },
    Utilities.newBlob(JSON.stringify(abjServices), MimeType.PLAIN_TEXT, fileName)
  )

  // compare
  // TODO: 期待したとおりに取れてないので直す
  const files = Array.from(Drive.Files.list({ q: { name: jsonFileName(new Date(Date.now() - 1000 * 3600 * 24)) }}))
  
  if (files.length > 0) {
    const currentServices = JSON.parse(DocumentApp.openById(servicesJson.id).getBody().getText())
    const oldServices = JSON.parse(DocumentApp.openById(files[0].id).getBody().getText())

    const diff = Object.keys(currentServices).filter(key => oldServices[key] === undefined)
    Logger.log(diff)
  } else {
    Logger.log('Cannot compare')
  }
}

function jsonFileName(date) {
  return `ABJServices-${date.toISOString().split('T')[0]}.json`
}
