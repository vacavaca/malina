import { h, view } from 'malina'
import { cssModules } from 'malina-decorator'

import styles from './style.scss'

export default view(
  <div styleName="footer">
    Made with <i styleName="love" /> by <a href="https://github.com/vacavaca">vacavaca</a>
    <br />
    <a href="https://github.com/vacavaca/malina/blob/master/packages/project-site">Site sources</a>
  </div>
).decorate(cssModules(styles))
