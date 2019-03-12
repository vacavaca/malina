import cn from 'classnames'
import { h, view } from 'malina'
import { cssModules, connect } from 'malina-decorator'
import { Route } from 'malina-router'

import styles from './style.scss'

const mapStoreToState = store => ({
  loading: store.pageLoading
})

const state = {
  loading: false,
  prev: false
}

const hooks = {}

hooks.update = (_, state) => {
  state.prev = state.loading
}

const Loader = view(
  state => {
    let transition = null
    if (!state.prev && state.loading)
      transition = 'in'
    else if (state.prev && !state.loading)
      transition = 'out'

    return <div
      styleName={cn('loader', {
        'loader--in': transition === 'in',
        'loader--out': transition === 'out'
      })}
    />
  }, state, {}, hooks)
  .decorate(cssModules(styles), connect(mapStoreToState))

export default view(
  state => <Route {...state}>{
    params => params != null ? <Loader /> : null
  }</Route>
)
