altCadesPlugin = null
certificatesList = null
$logBlock = null

init = =>

  $logBlock = $ '#ui-log-block'

  altCadesPlugin = new AltCadesPlugin()

  # проверка наличия плагина
  $logBlock.append '<h3>Проверка наличия плагина<h3>'
  if bowser.chrome or bowser.firefox or bowser.msie
    deferred = altCadesPlugin.init()
  else
    deferred = $.Deferred -> @reject 'Браузер не поддерживается'

  # проверка версии плагина
  deferred.then ->
#    $logBlock.append '<p>Плагин подключен<p>'
    $.when(
      altCadesPlugin.getVersion()
      $.get '/sites/default/files/products/cades/latest_2_0.txt'
    )

  # проверка версии CSP
  .then (installedVersion, currentVersion)->
    if installedVersion.full is currentVersion[0]?.trim()
      $logBlock.append '<p>У вас последняя версия плагина (' + installedVersion.full + ')<p>'
    else
      $logBlock.append '<p>У вас не последняя версия плагина. Рекомендуем обновить.<p>'

    altCadesPlugin.getCSPVersion()
  .then (cspVersion)->
    $logBlock.append '<p>Версия CSP (' + cspVersion.full + ')<p>'

    altCadesPlugin.getCertificates()
  .then (certificatesList_)->
    certificatesList = certificatesList_

    $logBlock.append '<p>Количество валидных сертификатов ' + +certificatesList.length + '<p>'
    selectHtml = '<p><select style="max-width: 1300px" id="ui-certificates-select">'
    $.each certificatesList, (index, certificate)->
      console.log(certificate.isValid)
      selectHtml += '<option value="' + index + '">' + '!!!'+certificate.isValid+ '!!!'+certificate.subject + ' ' +
          certificate.validFrom + '</option>'
    selectHtml += '</select></p>'
    $logBlock.append selectHtml

  .then ->
    $logBlock.append """
      <p>
        Введите данные которые надо подписать
        <br>
        <textarea id="ui-data-input" rows='15' cols='15' style="width: 650px;" value="test string"/>
        <textarea id="ui-data-output" rows='15' cols='15' readonly style="width: 650px;" value="result"/>
      </p>
      <p>
        <button type="button" id="ui-sign-button">Подписать</button>
      </p>
    """
    $('#ui-sign-button').on 'click', signData

  .fail (message)->
    if message
      $logBlock.append '<p style="color: #E23131">ошибка: ' + message + '<p>'

###*
Подписывает данные введенные в поле ввода
@method signData
###
signData = ->
  certificateIndex = +$('#ui-certificates-select').val()
  data = $('#ui-data-input').val()

  unless data
    alert 'Введите данные для подписывания'
    return
  altCadesPlugin.signData data, certificatesList[certificateIndex].certificate
  .then (signature)->


    $('#ui-data-output').val(signature)
  .fail (message)->
    if message
      console.log(message)
      $logBlock.append '<p style="color: #E23131">error: ' + message + '<p>'

$ init