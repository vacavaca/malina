import { h, view } from 'malina'
import { cssModules } from 'malina-decorator'

import state from './state'
import * as actions from './actions'
import * as hooks from './hooks'

import styles from './style.scss'

export default view(
  state => <div styleName="content" innerHtml={state.content} />,
  state, actions, hooks
).decorate(cssModules(styles))