import 'babel-polyfill'

import { h, mount } from 'malina'
import { createBrowserHistory } from 'history'

import App from './app'

const ready = () => {
  const history = createBrowserHistory()
  const view = mount(document.body, <App history={history} />)

  console.log(view)
}

document.addEventListener('DOMContentLoaded', ready)
