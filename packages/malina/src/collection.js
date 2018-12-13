import { diffArrays } from 'diff'
import { keys } from 'malina-util'
import { h } from './node'
import { view } from './declaration'
import { mount } from './view'

const index = index => {
  if (index == null)
    throw new Error("'indexBy' attribute of the List view must be defined as a string or function")

  if (index instanceof Function) return index
  else return item => item[index]
}

const state = state => ({
  data: state.data || [],
  accessor: index(state.indexBy),

  render: state.render,

  mountPoint: null,
  initialized: false,
  views: [],
  index: [],
  prevData: []
})

const ItemRenderer = view(({ render }) => render)

const actions = {}

const normalizeDiffPatches = patches => {
  let ndx = 0
  const result = []
  for (const patch of patches) {
    if (patch.added) {
      for (const value of patch.value) {
        result.push({ added: true, value, index: ndx })
        ndx += 1
      }
    } else if (patch.removed) {
      for (const value of patch.value)
        result.push({ removed: true, value, index: ndx })
    } else {
      for (const value of patch.value) {
        result.push({ value, index: ndx })
        ndx += 1
      }
    }
  }

  const added = {}
  for (const i in result) {
    const patch = result[i]
    if (patch.added)
      added[patch.value] = i
  }

  for (let i = 0; i < result.length; i++) {
    const patch = result[i]
    if (patch.removed && patch.value in added) {
      result.splice(i, 1)
      i--
    }
  }

  return result
}

actions.initialize = () => state => {
  const [container, mountIndex] = state.mountPoint
  while (container.firstChild)
    container.firstChild.remove()
  state.initialized = true

  state.index = []
  state.views = {}
  for (const i in state.data) {
    const index = +i
    const item = state.data[index]
    const key = state.accessor(item)
    state.index.push(key)

    const node = h(ItemRenderer, { render: state.render(item, index, state.data) })
    const instance = mount(container, node, mountIndex + index)

    state.views[key] = { view: instance, index: mountIndex + index }
  }

  requireUniqueIndex(state.index)
  state.prevData = state.data
}

const requireUniqueIndex = index => {
  const map = {}
  for (const key of index) {
    if (key in map)
      throw new Error('Item keys must be unique')
    map[key] = true
  }
  return index
}

actions.diffUpdate = () => state => {
  const [container, mountIndex] = state.mountPoint

  const index = state.data.map(state.accessor)
  requireUniqueIndex(index)
  const patches = diffArrays(state.index, index)
  const normalizedPatches = normalizeDiffPatches(patches)

  const updated = {}
  for (const i in normalizedPatches) {
    const patch = normalizedPatches[i]
    const key = patch.value
    const index = +patch.index
    const updating = key in state.views
    if (patch.added && key !== state.index[index]) {
      if (updating) { // swap to views
        const to = patch.index
        const swapKey = state.index[to]
        const { index: from, view: first } = state.views[key]
        const second = state.views[swapKey].view

        first.move(container, to)
        if (state.prevData[from] !== state.data[to])
          first.update({ render: state.render(state.data[to], to, state.data) })

        second.move(container, from + 1)
        if (state.prevData[to] !== state.data[from])
          second.update({ render: state.render(state.data[from], to, state.data) })

        state.views[key] = { view: first, index: to }
        state.views[swapKey] = { view: second, index: from }

        updated[key] = true
        updated[swapKey] = true
      } else { // add new view
        const item = state.data[index]
        const node = h(ItemRenderer, { render: state.render(item, index, state.data) })
        const instance = mount(container, node, mountIndex + index)
        state.views[key] = { view: instance, index: mountIndex + index }
      }
    } else if (patch.removed) { // remove view
      const instance = state.views[key].view
      instance.destroy()
      delete state.views[key]
    } else if (!(key in updated)) { // update view
      const item = state.data[index]
      if (item !== state.prevData[index])
        state.views[key].view.update({ render: state.render(item, index, state.data) })
    }
  }

  state.index = index
  state.prevData = state.data
}

actions.update = () => (state, actions) => {
  if (state.mountPoint == null)
    return

  if (state.initialized) actions.diffUpdate()
  else actions.initialize()
}

const hooks = {}

hooks.mount = (mount, state, actions) => {
  state.mountPoint = [mount.parentNode, Array.prototype.indexOf.call(mount.parentNode.childNodes, mount)]
  actions.update()
}

hooks.update = (m, s, actions) => {
  actions.update()
}

hooks.unmount = (_, state) => {
  state.mountPoint = null
  state.views = []
  state.index = []
}

const ListRenderer = view(null, state, actions, hooks)

export const List = view((state, _, children) => {
  let render = children[0]
  if (children.length > 1)
    throw new Error('You must provide only one child to the List, it can be a render function or a jsx node')

  if (render == null)
    return null

  render = render instanceof Function ? render : () => render
  return h(ListRenderer, { ...state, render })
})

export const Map = view((state, _, children) => {
  let render = children[0]
  if (children.length > 1)
    throw new Error('You must provide only one child to the Map, it can be a render function or a jsx node')

  if (render == null)
    return null

  render = render instanceof Function ? render : () => render
  const mapRender = ([key, value], i, data) => render(value, key, data, i)
  const data = keys(state.data || {}).map(k => [k, state.data[k]])
  const indexBy = ([k]) => k
  return h(ListRenderer, { data, indexBy, render: mapRender })
}, { data: {} })
