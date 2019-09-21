import { diffArrays } from 'diff';
import { keys } from 'malina-util';
import { h, view, template } from '../vdom';
import { mount } from '../view';
import { withLifecycle, withState } from '../decorator';
import { childIndex } from '../helper';

const index = index => {
  if (index == null)
    return (_, i) => i;

  if (index instanceof Function) return index;
  else return item => item[index];
};

const state = state => ({
  data: state.data || [],

  accessor: index(state.indexBy),
  render: state.render,
  mountPoint: null, // [parent, idnex]
  initialized: false,
  reverse: false,
  views: {},
  index: [],
  prevData: [],
  prevReverse: null
});

const ItemRenderer = template(({ state: { render } }) => render);

const normalizeDiffPatches = patches => {
  let ndx = 0;
  const result = [];
  for (const patch of patches) {
    if (patch.added) {
      for (const value of patch.value) {
        result.push({ added: true, value, index: ndx });
        ndx += 1;
      }
    } else if (patch.removed) {
      for (const value of patch.value)
        result.push({ removed: true, value, index: ndx });
    } else {
      for (const value of patch.value) {
        result.push({ value, index: ndx });
        ndx += 1;
      }
    }
  }

  const added = {};
  for (const i in result) {
    const patch = result[i];
    if (patch.added)
      added[patch.value] = i;
  }

  for (let i = 0; i < result.length; i++) {
    const patch = result[i];
    if (patch.removed && patch.value in added) {
      result.splice(i, 1);
      i--;
    }
  }

  return result;
};

const buildIndex = state => {
  const index = [];
  for (let i = 0; i < state.data.length; i++) {
    const viewIndex = indexToDataIndex(state, i); // data index to view index
    index.push(state.accessor(state.data[viewIndex]));
  }

  requireUniqueIndex(index);
  return index;
};

const indexToDataIndex = (state, ndx) => (state.reverse ? (state.data.length - 1 - ndx) : ndx);

const indexToPrevDataIndex = (state, ndx) => {
  if (state.prevReverse !== null) return (state.prevReverse ? (state.prevData.length - 1 - ndx) : ndx);
  else return (state.reverse ? (state.prevData.length - 1 - ndx) : ndx);
};

const initialize = ({ state }) => {
  const [container, mountIndex] = state.mountPoint;
  container.childNodes[mountIndex].remove();

  const index = buildIndex(state);
  for (let i = 0; i < index.length; i++) {
    const dataIndex = indexToDataIndex(state, i);
    const item = state.data[dataIndex];
    const key = index[i];

    const node = h(ItemRenderer, { render: state.render(item, index, state.data) });
    const instance = mount(container, node, mountIndex + i);

    state.views[key] = { view: instance, index: i };
  }

  state.index = index;
  state.initialized = true;
  state.prevData = state.data;
  state.prevReverse = state.reverse;
};

const requireUniqueIndex = index => {
  const map = {};
  for (const key of index) {
    if (key in map)
      throw new Error('Item keys must be unique');
    map[key] = true;
  }
  return index;
};

const diffUpdate = ({ state }) => {
  const [container, mountIndex] = state.mountPoint;

  const index = buildIndex(state);

  const patches = diffArrays(state.index, index);
  const normalizedPatches = normalizeDiffPatches(patches);

  const updated = {};
  for (const i in normalizedPatches) {
    const patch = normalizedPatches[i];
    const key = patch.value;
    const index = +patch.index;
    const dataIndex = indexToDataIndex(state, index);
    const updating = key in state.views;
    if (patch.added && key !== state.index[index]) {
      if (updating) { // swap two views
        const to = patch.index;
        const swapKey = state.index[to];
        const { index: from, view: first } = state.views[key];
        const second = state.views[swapKey].view;

        const fromPrevDataIndex = indexToPrevDataIndex(state, from);
        const toPrevDataIndex = indexToPrevDataIndex(state, to);
        const toDataIndex = indexToDataIndex(state, to);
        const fromDataIndex = indexToDataIndex(state, from);

        first.move(container, to + mountIndex);
        if (state.prevData[fromPrevDataIndex] !== state.data[toDataIndex])
          first.update({ render: state.render(state.data[toDataIndex], to, state.data) });

        second.move(container, from + 1 + mountIndex);
        if (state.prevData[toPrevDataIndex] !== state.data[fromDataIndex])
          second.update({ render: state.render(state.data[fromDataIndex], to, state.data) });

        state.views[key] = { view: first, index: to };
        state.views[swapKey] = { view: second, index: from };

        updated[key] = true;
        updated[swapKey] = true;
      } else { // add new view
        const item = state.data[dataIndex];
        const node = h(ItemRenderer, { render: state.render(item, index, state.data) });
        const instance = mount(container, node, mountIndex + index);
        state.views[key] = { view: instance, index: index };
      }
    } else if (patch.removed) { // remove view
      const instance = state.views[key].view;
      instance.destroy();
      delete state.views[key];
    } else if (!(key in updated)) { // update view
      const item = state.data[dataIndex];
      const prevDataIndex = indexToPrevDataIndex(state, index);
      if (item !== state.prevData[prevDataIndex])
        state.views[key].view.update({ render: state.render(item, index, state.data) });
    }
  }

  state.index = index;
  state.prevData = state.data;
  state.prevReverse = state.reverse;
};

const update = view => {
  if (view.state.mountPoint == null)
    return;

  if (view.state.initialized) diffUpdate(view);
  else initialize(view);
};

const handleMount = view => {
  const { state, element } = view;
  state.mountPoint = [element.parentNode, childIndex(element)];
  update(view);
};

const handleDestroy = ({ state }) => {
  for (const { view } of Object.values(state.views))
    view.destroy(false);

  const [container, index] = state.mountPoint;
  for (let i = 0; i < state.data.length; i++)
    container.childNodes[index].remove();

  state.mountPoint = null;
  state.initialized = false;
  state.views = {};
  state.index = [];
  state.prevData = [];
  state.prevReverse = null;
};

const ListRenderer = view(
  withState(state),
  withLifecycle({
    mount: handleMount,
    update,
    destroy: handleDestroy
  })
);

/**
 * Indexed list view
 *
 * @example
 * const items = []
 * <List data={items} indexBy="id">{
 *  (item, index, items) => <Item {...item} />
 * }</List>
 */
export const List = template(({ state, children }) => {
  if (children.length !== 0) {
    if (children.length !== 1 || !(children[0] instanceof Function))
      throw new Error('You must provide a render function as the only children to the List');

    const render = children[0];

    return h(ListRenderer, { ...state, render });
  } else return null;
});

/**
 * Map view
 *
 * @example
 * const items = {}
 * <Map data={items}>{
 *  (item, index, items) => <Item {...item} />
 * }</Map>
 */
export const Map = template(({ state, children }) => {
  if (children.length !== 1 || !(children[0] instanceof Function))
    throw new Error('You must provide a render function as the only children to the Map');

  const render = children[0];

  const mapRender = ([key, value], i, data) => render(value, key, data, i);
  const data = keys(state.data || {}).map(k => [k, state.data[k]]);
  const indexBy = ([k]) => k;
  return h(ListRenderer, { data, indexBy, render: mapRender });
});
