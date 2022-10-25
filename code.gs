function checkDiff() {
  const targetUrl = PropertiesService.getScriptProperties().getProperty('TARGET_URL')
  const response = UrlFetchApp.fetch(targetUrl)
  Logger.log(pdfToText(response.getBlob()))

  // TODO: diffを検出する
}

function pdfToText(pdfBlob) {
  const baseName = pdfBlob.getName().replace(/\.pdf$/, `-${Utilities.getUuid()}`)

  const gdocFile = Drive.Files.insert(
    {
      title: baseName.concat('.gdoc'),
      mimeType: pdfBlob.getContentType()
    },
    pdfBlob,
    {
      ocr: true,
      ocrLanguage: 'ja'
    }
  )  
  const text = DocumentApp.openById(gdocFile.id).getBody().getText()
  Drive.Files.remove(gdocFile.id)
  
  var abjServices = {}
  const matched = text.matchAll(/(ABJ \d+)\s((?:(?!ABJ).)*)/g)
  Array.from(matched).forEach(([, abjID, service]) => {
    abjServices[abjID] = service
  })

  const jsonFileName = baseName.concat('.json')
  const jsonFile = Drive.Files.insert(
    {
      title: jsonFileName,
      mimeType: MimeType.PLAIN_TEXT
    },
    Utilities.newBlob(JSON.stringify(abjServices), MimeType.PLAIN_TEXT, jsonFileName)
  )

  return jsonFile.id
}
