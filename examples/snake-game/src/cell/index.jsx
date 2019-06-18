import { h, view } from 'malina'
import { withTemplate, cssModules, withState } from 'malina-decorator'
import cn from 'classnames'

import styles from './style.scss'

const state = {
  x: 0,
  y: 0,
  size: null,
  style: null
}

export default view(
  withTemplate(({ state: { x, y, size, style } }) =>
    <rect x={x} y={y} width={1 - 1 / size} height={1 - 1 / size} styleName={cn('cell', style)} />),
  withState(state),
  cssModules(styles)
)