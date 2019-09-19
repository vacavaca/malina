import { h, view } from 'malina'
import { cssModules, connect } from 'malina-decorator'
import cn from 'classnames'

import { default as Code, languages } from '../code'
import LocationAnimator from '../location-animation'

import styles from './styles.scss'

//  handled by parcel
import { readFileSync } from 'fs'
const example = readFileSync(__dirname + '/example.jsx', 'utf-8')

const getNameClass = transition =>
  cn("name", {
    "name--show": transition === 'in'
  })

const ProjectName = view(
  ({ transition }) => <h1 styleName={getNameClass(transition)}>malina</h1>
).decorate(cssModules(styles))

export default view(state =>
  <div styleName="home">
    <div styleName="container">
      <div styleName="left">
        <div styleName="project">
          <LocationAnimator hash path="#/">{
            (_, transition) => <ProjectName transition={transition} />
          }</LocationAnimator>
          <span styleName="version">{state.version}</span>
        </div>
        <p styleName="desc">Templating and state-management tool<br />for the modern web.</p>
        <Code class={styles.install} language={languages.bash}>npm install --save malina</Code>
      </div>
      <div styleName="right">
        <Code language={languages.jsx}>{example}</Code>
      </div>
    </div>
  </div>
).decorate(
  cssModules(styles),
  connect(({ version }) => ({ version }))
)
