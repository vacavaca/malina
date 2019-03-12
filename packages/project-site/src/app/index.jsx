import { h, view } from 'malina'
import { cssModules, connect, bindActions } from 'malina-decorator'
import { Switch, Route, connectRouter } from 'malina-router'

import { startAnimations } from '../store/animation'

import Header from '../header'
import Footer from '../footer'
import HomePage from '../home-page'
import Changelog from '../changelog'
import Docs from '../docs'

import styles from './style.scss'

const storeActions = bindActions({
  startAnimations
})

const hooks = {}

hooks.create = (_, { router, location }) => {
  if (!location.hash)
    router.replace('/#/')

}

hooks.mount = (_, state) => {
  state.startAnimations()
}

export default view(state =>
  <div styleName="app">
    <Header />
    <div styleName="content-container">
      <div styleName="content">
        <Switch history={state.history}>
          <Route hash path="#/">
            <HomePage />
          </Route>
          <Route hash path="#/changelog">
            <Changelog />
          </Route>
          <Route hash path="#/docs/:path(.*)?">{
            params => <Docs {...params} />
          }</Route>
        </Switch>
      </div>
    </div>
    <Footer />
  </div>,
  {}, {}, hooks)
  .decorate(
    connectRouter,
    cssModules(styles),
    connect(null, storeActions)
  )
