import { diffArrays } from 'diff'
import { keys } from 'malina-util'
import { h, isElementNode } from '../vdom'
import { mount, view } from '../view'

const index = index => {
  if (index == null)
    return (_, i) => i

  if (index instanceof Function) return index
  else return item => item[index]
}

const state = state => ({
  data: state.data || [],
  accessor: index(state.indexBy),

  render: state.render,
  path: state.path,

  mountPoint: null,
  initialized: false,
  views: {},
  index: [],
  prevData: []
})

const ItemRenderer = view(({ state: { render } }) => render)

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

const initialize = ({ state }) => {
  const [container, mountIndex] = state.mountPoint
  if (state.path.length === 0)
    container.childNodes[mountIndex].remove()
  state.initialized = true

  state.index = []
  state.views = {}
  for (const i in state.data) {
    const index = +i
    const item = state.data[index]
    const key = state.accessor(item, index, state.data)
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

const diffUpdate = ({ state }) => {
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

const update = view => {
  if (view.state.mountPoint == null)
    return

  if (view.state.initialized) diffUpdate(view)
  else initialize(view)
}

const handleMount = view => {
  if (state.path.length > 0) {
    let container = mount
    for (const index of state.path.slice(0, -1))
      container = container.childNodes[index]

    state.mountPoint = [container, state.path[state.path.length - 1]]
  } else
    state.mountPoint = [mount.parentNode, Array.prototype.indexOf.call(mount.parentNode.childNodes, mount)]
  actions.update()
}

const handleUnmount = view => {
  view.state.mountPoint = null
  view.state.initialized = false
  view.state.views = {}
  view.state.index = []
  view.state.prevData = []
}

const behavior = async view => {
  view.state = { ...view.state, ...state }

  view.onMount(handleMount)
  view.onUpdate(update)
  view.onUnmount(handleUnmount)
}

const ListRenderer = view(({ children }) => children, behavior)

const findRenderer = (node, path = []) => {
  if (node instanceof Function)
    return [path, node]

  if (isElementNode(node)) {
    for (const i in node.children) {
      const nextPath = path.concat([+i])
      const renderer = findRenderer(node.children[i], nextPath)
      if (renderer != null)
        return renderer
    }
  }
}

const removeRenderer = (node, path) => {
  if (isElementNode(node)) {
    let children
    if (path.length === 1) {
      const index = path[path.length - 1]
      children = node.children.slice(0, index).concat(node.children.slice(index + 1))
    } else {
      const index = path[0]
      children = node.children.map((child, i) => {
        if (i === index) return removeRenderer(child, path.slice(1))
        else return child
      })
    }
    return h(node.tag, node.attrs, children)
  } else return node
}

export const List = view((state, _, children) => {
  if (children.length !== 0) {
    if (children.length !== 1)
      throw new Error('You must provide only one child to the List')

    let childrenToRender
    let path = []
    let render
    if (!(children[0] instanceof Function)) {
      [path, render] = findRenderer(children[0])
      childrenToRender = removeRenderer(children[0], path)
    } else {
      render = children[0]
      childrenToRender = null
    }

    return h(ListRenderer, { ...state, path, render }, childrenToRender)
  } else return null
})

export const Map = view((state, _, children) => {
  if (children.length !== 1)
    throw new Error('You must provide only one child to the List')

  let childrenToRender = children
  let path = []
  let render
  if (!(children[0] instanceof Function)) {
    [path, render] = findRenderer(children[0])
    childrenToRender = removeRenderer(children[0], path)
  } else render = children[0]

  const mapRender = ([key, value], i, data) => render(value, key, data, i)
  const data = keys(state.data || {}).map(k => [k, state.data[k]])
  const indexBy = ([k]) => k
  return h(ListRenderer, { data, indexBy, path, render: mapRender }, childrenToRender)
}, { data: {} })
