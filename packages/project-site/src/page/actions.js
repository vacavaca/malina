import { imports } from '../templates'
import { cancellablePromise } from '../util'

export const setLoading = loading => state => {
  state.setGlobalLoading(loading)

  return {
    loading
  }
}

export const setLoaded = content => state => {
  state.setGlobalLoading(false)

  return {
    content,
    loading: false,
    error: null
  }
}

export const setError = error => state => {
  state.setGlobalLoading(false)

  return {
    loading: false,
    error
  }
}

export const loadPage = () => async (state, actions) => {
  if (state.request != null)
    state.request.cancel()

  await actions.setLoading(true)

  try {
    state.request = cancellablePromise(imports[state.name])
    const content = await state.request
    actions.setLoaded(content)
  } catch (error) {
    console.error(error)
    actions.setError(error)
  } finally {
    state.request = null
  }
}

export const cancelLoading = () => state => {
  state.setGlobalLoading(false)

  if (state.request != null)
    state.request.cancel()

  return {
    loading: false,
    request: null
  }
}