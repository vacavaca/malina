import { h, view } from 'malina'
import cn from 'classnames'
import { cssModules } from 'malina-decorator'
import { Link, Route } from 'malina-router'

import Loader from './loader'
import LocationAnimator from '../location-animation'

import styles from './style.scss'

const state = {
  scrolled: false,
  firstRender: true
}

const actions = {}

actions.handleScroll = e => () => {
  const top = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0
  return {
    scrolled: top > 200
  }
}

const hooks = {}

hooks.mount = (e, s, actions) => {
  window.addEventListener('scroll', actions.handleScroll, { passive: true })
}

hooks.unmount = (e, s, actions) => {
  window.removeEventListener('scroll', actions.handleScroll)
}

const getNameClass = ({ state, transition }) =>
  cn("name", {
    'name--show': state === 'in' && transition == null,
    'name--slideIn': transition === 'in',
    'name--slideOut': transition === 'out'
  })

const getLogoClass = ({ state }) =>
  cn('logo', {
    'logo--show': state === 'out'
  })

const Home = view(
  state =>
    <Link to="#/" styleName="home">
      <i styleName={getLogoClass(state)} />
      <div styleName={getNameClass(state)}>malina</div>
    </Link>
).decorate(cssModules(styles))

const MenuLink = view(
  (state, a, children) =>
    <li styleName="item">
      <Link class={styles.link} to={state.to}>{children}</Link>
      <Loader hash path={state.to} />
    </li>
).decorate(cssModules(styles))

const HardMenuLink = view(
  (state, a, children) =>
    <li styleName="item">
      <a styleName="link" href={state.to}>
        {children}
      </a>
    </li>
).decorate(cssModules(styles))

const Menu = view(
  <ul styleName="menu">
    <MenuLink key="docs" to="#/docs/guide">Docs</MenuLink>
    <MenuLink key="api" to="#/api">API</MenuLink>
    <MenuLink key="change" to="#/changelog">Changelog</MenuLink>
    <HardMenuLink key="github" to="https://github.com/vacavaca/malina">
      <i styleName="icon github" /> Github
    </HardMenuLink>
    <HardMenuLink key="npm" to="https://www.npmjs.com/package/malina">
      <i styleName="icon npm" /> npm
    </HardMenuLink>
  </ul >
).decorate(cssModules(styles))

export default view(state =>
  <div styleName={cn("header", { "header--scroll": state.scrolled })}>
    <div styleName="content">
      <LocationAnimator invert hash path="#/">{
        (state, transition) => <Home state={state} transition={transition} />
      }</LocationAnimator>
      <Menu />
    </div>
  </div>,
  state, actions, {})
  .decorate(cssModules(styles))
