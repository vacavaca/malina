import { h, view } from 'malina'
import { connect, bindActions } from 'malina-decorator'
import { setLoading } from '../store/page-loader'

import state from './state'
import * as actions from './actions'
import * as hooks from './hooks'

const mapStoreUpdate = bindActions({
  setGlobalLoading: setLoading
})

export default view((state, _, children) => {
  const render = children[0] || null
  if (render == null)
    return null

  return render(state.content)
}, state, actions, hooks).decorate(connect(null, mapStoreUpdate))

export { names as pages } from '../templates'
