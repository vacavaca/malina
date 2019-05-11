import { h, view } from 'malina'
import { cssModules, withState } from 'malina-decorator'
import cn from 'classnames'

import styles from './style.scss'

const state = {
  x: 0,
  y: 0,
  size: null,
  style: null
}

export default view(({ state: { x, y, size, style } }) =>
  <rect x={x} y={y} width={1 - 1 / size} height={1 - 1 / size} styleName={cn('cell', style)} />)
  .decorate(withState(state), cssModules(styles))