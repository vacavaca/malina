import 'babel-polyfill'

import { h, mount } from 'malina'
import { createBrowserHistory } from 'history'

import App from './app'

const ready = () => {
  const history = createBrowserHistory()
  console.log(mount(document.body, <App history={history} />))
}

document.addEventListener('DOMContentLoaded', ready)
