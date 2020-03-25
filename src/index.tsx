import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {WaitingPage} from 'components/waiting'

export default (): string => '<!doctype html>' + ReactDOMServer.renderToString(
  <html lang="fr">
    <head>
      <meta charSet="utf-8" />
      <title>Bob-Covid</title>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        id="viewport" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Bob-Covid" />
      <meta property="og:description" name="description" content="Mettre une description" />
      <meta property="og:image" content="https://www.bob-emploi.fr/assets/bob-circle-picto.png" />
      <meta property="og:url" content="https://www.bob-emploi.fr/" />
    </head>
    <body style={{margin: 0}}>
      <div id="app"><WaitingPage /></div>
    </body>
  </html>)
