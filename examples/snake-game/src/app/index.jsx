import { h, view, withTemplate, withState, withActions } from 'malina'
import { cssModules } from 'malina-decorator'
import state from './state'
import * as actions from './action'
import Level from '../level'

import styles from './style.scss'

export default view(
  withTemplate(({ state: { score, best }, actions }) =>
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
    </div>),
  withState(state),
  withActions(actions),
  cssModules(styles)
)
