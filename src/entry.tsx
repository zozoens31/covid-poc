import React from 'react'
import ReactDOM from 'react-dom'
import {AppContainer} from 'react-hot-loader'

import {App} from 'components/main'


ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('app'),
)


// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/main', (): void => {
    const NextApp = require('./components/main').App
    ReactDOM.render(
      <AppContainer>
        <NextApp />
      </AppContainer>,
      document.getElementById('app'),
    )
  })
}
