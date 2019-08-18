import { withContext, getContext, withLifecycle, withActions } from 'malina'
import { compose } from 'malina-util'

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

const updateKey = Symbol.for('__malina_router_update')
const subscriptionKey = Symbol.for('__malina_router_subscription')

const enableRouting = compose(
  withLifecycle({
    create: view => {
      const { router } = view.state
      view.state[subscriptionKey] = router.history.listen(view.actions[updateKey])
    },

    destroy: view => {
      if (subscriptionKey in view.state)
        view.state[subscriptionKey]()
    }
  }),
  withActions({
    [updateKey]: location => () => ({ location })
  })
)

const provideLocationState = withLifecycle({
  create: view => {
    view.state = {
      ...(view.state || {}),
      router: view.state.router.control,
      location: view.state.location || view.state.router.history.location
    }
  },
  update: view => {
    view.state = {
      ...(view.state || {}),
      router: view.state.router.control,
      location: view.state.location || view.state.router.history.location
    }
  }
})

const provideRouterState = withLifecycle({
  create: view => {
    view.state = {
      ...(view.state || {}),
      router: view.state.router.control
    }
  },
  update: view => {
    view.state = {
      ...(view.state || {}),
      router: view.state.router.control
    }
  }
})

const routerKey = Symbol.for('__malina_router')

const withRouterContext = (historyKey = null) => compose(
  // try to get router from context
  getContext(ctx => routerKey in ctx ? { router: ctx[routerKey] } : {}),
  // create router if missing in context
  withContext(({ state }) => {
    if (state == null || (!(historyKey in state) && !('router' in state)))
      throw new Error('History object must be provided to the top-level routing view')

    if (historyKey in state && !('router' in state)) {
      const router = createRouter(state[historyKey])
      state.router = router
      return { [routerKey]: router }
    } else return {}
  })
)

export const withRouter = (historyKey = 'history') => compose(
  withRouterContext(historyKey),
  provideRouterState
)

export const connectRouter = (historyKey = 'history') => compose(
  withRouterContext(historyKey),
  enableRouting,
  provideLocationState
)
