import 'babel-polyfill'

import { h, mount } from 'malina'
import { withStore } from 'malina-decorator'
import { createBrowserHistory } from 'history'

import store from './store'
import App from './app'

import package from '../package.json'

import hljs from 'highlight.js/lib/highlight'

import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('bash', bash)

const ready = () => {
  const history = createBrowserHistory()
  const storeState = store()
  const AppWithStore = App.decorate(withStore(storeState))

  mount(document.body, <AppWithStore history={history} />)
}

document.addEventListener('DOMContentLoaded', ready)
