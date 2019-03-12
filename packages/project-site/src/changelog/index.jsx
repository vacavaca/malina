import { h, view } from 'malina'
import { cssModules } from 'malina-decorator'
import { default as Page, pages } from '../page'

import styles from './style.scss'

const Changelog = view(
  state => <div styleName="changelog" innerHtml={state.content} />
).decorate(cssModules(styles))

export default view(
  <Page name={pages.changelog}>{
    content => <Changelog content={content} />
  }</Page>
)
