import { h, view } from 'malina'
import { cssModules, withState, withActions } from 'malina-decorator'
import state from './state'
import actions from './action'
import Level from '../level'

import styles from './style.scss'

export default view(({ state: { score, best }, actions }) =>
  <div styleName="app">
    <div styleName="app-score">
      <span styleName="app-currentScore">Score: {score}</span>
      <span styleName="app-bestScore">Best: {best !== null ? best : '—'}</span>
    </div>
    <Level
      cellSize={20}
      fieldSize={30}
      speed={6}
      onScore={actions.handleScore}
    />
  </div>).decorate(
  withState(state),
  withActions(actions),
  cssModules(styles)
)
