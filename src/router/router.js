import { withContext, getContext, withHooks, withActions, mapState } from '../decorator/index'
import { compose, omit } from '../util'

const getRouterControl = history => ({
  push(url, state) {
    history.push(url, state)
  },

  replace(url, state) {
    history.replace(url, state)
  },

  forward() {
    history.forward()
  },

  back() {
    history.back()
  }
})

const createRouter = history => ({
  history,
  control: getRouterControl(history)
})

const updateKey = Symbol('update')
const subscriptionKey = Symbol('subscription')

const enableRouting = compose(
  withHooks({
    create: original => (mount, state, actions) => {
      original()
      const { router } = state
      state[subscriptionKey] = router.history.listen(actions[updateKey])
    },

    destroy: original => (mount, state, actions) => {
      if (subscriptionKey in state)
        state[subscriptionKey]()
      original()
    }
  }),
  withActions({
    [updateKey]: location => () => ({ location })
  })
)

const provideState = mapState(state => ({
  router: state.router.control,
  location: state.location || state.router.history.location,
  ...omit(['history', 'router'], state)
}))

const routerKey = Symbol('router')

const withRouterContext = compose(
  // try to get router from context
  getContext(ctx => routerKey in ctx ? { router: ctx[routerKey] } : {}),
  // create router if missing in context
  withContext(state => {
    if (state == null || (!('history' in state) && !('router' in state)))
      throw new Error('History object must be provided to the top-level routing view')

    if ('history' in state && !('router' in state)) {
      const router = createRouter(state.history)
      return { [routerKey]: router }
    } else return {}
  })
)

export const withRouter = compose(
  withRouterContext,
  provideState
)

export const connectRouter = compose(
  enableRouting,
  withRouterContext,
  provideState
)
