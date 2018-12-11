import { h, view } from 'malina'
import cn from 'classnames'
import { cssModules } from 'malina-decorator'
import { default as state, gridLengthToScreen } from './state'
import actions from './action'
import hooks from './hook'
import Cell from '../cell'

import styles from './style.scss'

const viewBox = state =>
  `0 0 ${state.fieldSize} ${state.fieldSize}`

const screenSize = state => ({
  width: gridLengthToScreen(state, state.fieldSize),
  height: gridLengthToScreen(state, state.fieldSize),
})

const getCellStyle = (state, index) =>
  index === state.snake.length - 1 ? 'head' : 'tail'

export default view((state, actions) =>
  <svg styleName={cn('level', {
    'level--gameover': state.gameOver,
    'level--paused': state.paused
  })} viewBox={viewBox(state)} {...screenSize(state)} onClick={actions.handleClick}>
    <a href="#" styleName="level-focus" tabindex={0} onKeyDown={actions.handleKeyDown} onBlur={actions.handleBlur} />
    <rect x={0} y={0} width={state.fieldSize} height={state.fieldSize} styleName="level-background" />
    <Cell key="apple" {...state.apple} size={state.cellSize} style="apple" />
    {state.snake.map((pos, i) =>
      <Cell key={`snake.${i}`} {...pos} size={state.cellSize} style={getCellStyle(state, i)} />
    )}
  </svg>,
  state, actions, hooks)
  .decorate(cssModules(styles))
