import 'babel-polyfill'

import { h, mount } from 'malina'

import App from './app'

const ready = () => {
  mount(document.body, <App />)
}

document.addEventListener('DOMContentLoaded', ready)
