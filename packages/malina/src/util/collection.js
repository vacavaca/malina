import { diffArrays } from 'diff'
import { keys } from 'malina-util'
import { h, Declaration } from '../vdom'
import { mount } from '../view'

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
  mountPoint: null,
  initialized: false,
  reverse: false,
  views: {},
  index: [],
  prevData: []
})

const ItemRenderer = new Declaration(({ state: { render } }) => render)

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

// FIXME error when items are added to the end of the list, check

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
  const { state, element } = view
  state.mountPoint = [element.parentNode, Array.prototype.indexOf.call(element.parentNode.childNodes, element)]
  update(view)
}

const handleDestroy = ({ state }) => {
  for (const { view } of Object.values(state.views))
    view.destroy(false)

  const [container, index] = state.mountPoint
  for (let i = 0; i < state.data.length; i++)
    container.childNodes[index].remove()

  state.mountPoint = null
  state.initialized = false
  state.views = {}
  state.index = []
  state.prevData = []
}

const behavior = async view => {
  view.state = { ...view.state, ...state(view.state) }

  view.onMount(handleMount)
  view.onUpdate(update)
  view.onDestroy(handleDestroy)
}

const ListRenderer = new Declaration(null, behavior)

/**
 * Indexed list view
 *
 * @example
 * const items = []
 * <List data={items} indexBy="id">{
 *  (item, index, items) => <Item {...item} />
 * }</List>
 */
export const List = new Declaration(({ state, children }) => {
  if (children.length !== 0) {
    if (children.length !== 1 || !(children[0] instanceof Function))
      throw new Error('You must provide a render function as the only children to the List')

    const render = children[0]

    return h(ListRenderer, { ...state, render })
  } else return null
})

/**
 * Map view
 *
 * @example
 * const items = {}
 * <Map data={items}>{
 *  (item, index, items) => <Item {...item} />
 * }</Map>
 */
export const Map = new Declaration(({ state, children }) => {
  if (children.length !== 1 || !(children[0] instanceof Function))
    throw new Error('You must provide a render function as the only children to the Map')

  const render = children[0]

  const mapRender = ([key, value], i, data) => render(value, key, data, i)
  const data = keys(state.data || {}).map(k => [k, state.data[k]])
  const indexBy = ([k]) => k
  return h(ListRenderer, { data, indexBy, render: mapRender })
})
