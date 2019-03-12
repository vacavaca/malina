import { h, view } from 'malina'
import { cssModules } from 'malina-decorator'
import { Route, Link } from 'malina-router'
import cn from 'classnames'

import state from './state'
import * as actions from './actions'
import * as hooks from './hooks'

import styles from './style.scss'

export const IndexLink = view(
  (state, _, children) =>
    <Route hash path={state.to}>{
      params =>
        <li class={styles.item}>
          <Link class={cn(styles.link, {
            [styles['link--active']]: params != null
          })}>{children}</Link>
        </li>
    }</Route>
)

export default view(
  state =>
    <ul styleName="index" style={{ top: `${state.offset}px` }}>
      {/* <IndexLink to="#/docs/guide/getting-started">Getting Started</IndexLink> */}
      {/* <li styleName="item">
        <ul styleName="subIndex">
          <IndexLink key="templates" to="#/docs/guide/templates">Templates</IndexLink>
          <IndexLink key="state" to="#/docs/guide/state">State</IndexLink>
          <IndexLink key="actions" to="#/docs/guide/actions">Actions</IndexLink>
          <IndexLink key="hooks" to="#/docs/guide/hooks">Hooks</IndexLink>
          <IndexLink key="mounting" to="#/docs/guide/mounting">Mounting</IndexLink>
        </ul>
      </li>
      <IndexLink key="examples" to="#/docs/guide/examples">Examples</IndexLink>
      <IndexLink key="constraints" to="#/docs/guide/constraints-and-limitations">Constraints and Limitations</IndexLink>
      <IndexLink key="comparison" to="#/docs/guide/comparison-with-other-frameworks">Comparison with other Frameworks</IndexLink>
      <IndexLink key="decorators" to="#/docs/decorators">Decorators</IndexLink>
      <IndexLink key="routing" to="#/docs/routing">Routing</IndexLink>
      <IndexLink key="server" to="#/docs/server-side">Server-side Rendering</IndexLink>
      <IndexLink key="performance" to="#/docs/performance">Performance</IndexLink>
      <IndexLink key="testing" to="#/docs/testing">Testing</IndexLink> */}
    </ul>,
  state, actions, hooks
).decorate(cssModules(styles))
