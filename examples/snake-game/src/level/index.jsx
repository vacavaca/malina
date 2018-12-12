import { h, view } from 'malina'
import cn from 'classnames'
import { cssModules, withRefs } from 'malina-decorator'
import { default as state, gridLengthToScreen } from './state'
import actions from './action'
import hooks from './hook'
import Cell from '../cell'

import styles from './style.scss'

const viewBox = state =>
  `0 0 ${state.fieldSize} ${state.fieldSize}`

const getScreenSize = state => ({
  width: gridLengthToScreen(state, state.fieldSize),
  height: gridLengthToScreen(state, state.fieldSize),
})

const getCellStyle = (state, index) =>
  index === state.snake.length - 1 ? 'head' : 'tail'

const getInfoText = state =>
  state.gameOver ? "Click to restart" : "Click to resume"

const renderBackground = state =>
  <rect
    x={0}
    y={0}
    width={state.fieldSize}
    height={state.fieldSize}
    styleName={cn("level-background", {
      'paused': state.paused,
      'gameover': state.gameOver
    })} />

const renderApple = state =>
  <Cell
    key="apple"
    {...state.apple}
    size={state.cellSize}
    style="apple" />

const renderSnake = (state, pos, index) =>
  <Cell
    key={`snake.${index}`}
    {...pos}
    size={state.cellSize}
    style={getCellStyle(state, index)} />

const renderFocusHook = (state, actions) =>
  <a
    href="#"
    ref={actions.handleFocusHook}
    tabindex={0}
    onKeyDown={actions.handleKeyDown}
    onBlur={actions.handleBlur} />

const renderField = (state, actions) => {
  const screenSize = getScreenSize(state)
  const screenSizeStyle = {
    width: `${screenSize.width}px`,
    height: `${screenSize.height}px`,
  }

  return (
    <svg
      styleName={cn('level', {
        'gameover': state.gameOver,
        'paused': state.paused
      })}
      {...screenSize}
      style={screenSizeStyle}
      viewBox={viewBox(state)}
      onClick={actions.handleClick}
    >
      {renderBackground(state)}
      {renderApple(state)}
      {state.snake.map((pos, i) => renderSnake(state, pos, i))}
    </svg>
  )
}

const renderInfo = state =>
  <div styleName={cn("level-info", {
    "show": state.paused
  })}>{getInfoText(state)}</div>

export default view((state, actions) =>
  <div styleName="level-container">
    {renderFocusHook(state, actions)}
    {renderInfo(state)}
    {renderField(state, actions)}
  </div>,
  state, actions, hooks)
  .decorate(cssModules(styles), withRefs())
