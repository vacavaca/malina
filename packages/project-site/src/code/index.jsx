import { h, view } from 'malina'
import { cssModules, withRefs } from 'malina-decorator'
import { omit } from 'malina-util'
import hljs from 'highlight.js/lib/highlight'
import { runMicroTask } from '../util'

import styles from './style.scss'

const state = {
  language: 'jsx',
  element: null
}

const actions = {}

actions.handleElement = element => state => {
  state.element = element
}

actions.highlight = () => state => {
  if (state.element != null)
    hljs.highlightBlock(state.element)
}

const hooks = {}

const highlight = (element, state) => {
  runMicroTask(() => {
    if (state.element != null)
      hljs.highlightBlock(element)
  })
}

hooks.mount = (e, s, actions) => {
  runMicroTask(actions.highlight)
}

hooks.update = (e, s, actions) => {
  runMicroTask(actions.highlight)
}

const getClassName = state =>
  `language-${state.language} ${state.class || ''}`.trim()

export default view((state, actions, children) =>
  <pre
    styleName="code"
    ref={actions.handleElement}
    class={getClassName(state)}
    {...omit(['language', 'element'], state)}
  >
    {children}
  </pre>, state, actions, hooks)
  .decorate(cssModules(styles), withRefs())

export const languages = {
  javascript: 'javascript',
  jsx: 'javascript',
  js: 'javascript',
  bash: 'bash',
}
