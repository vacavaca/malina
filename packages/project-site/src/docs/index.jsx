import { h, view } from 'malina'
import { cssModules } from 'malina-decorator'
import { default as Page, pages } from '../page'

import Content from './content'
import Index from './index/index'

import styles from './style.scss'

export default view(
  <div styleName="docs">
    <Page name={pages.guide}>{
      content => <Content content={content} />
    }</Page>
    <Index />
  </div>
).decorate(cssModules(styles))
