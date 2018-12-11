import { h, view } from 'malina'

import { toggleClass } from './util'

const state = {
  todo: null,
  editing: false,
  input: ''
}

const actions = {}

actions.onComplete = e => state => {
  state.actions.onComplete(state.todo, e.currentTarget.checked)
}

actions.onDestroy = () => state => {
  state.actions.onDestroy(state.todo)
}

actions.onStartEdit = e => ({ element, todo: { title } }) =>
  ({ editing: true, input: title })

actions.onDoneEdit = e => state => {
  if (!state.editing)
    return

  const title = e.currentTarget.value.trim()
  if (title.length > 0)
    state.actions.onEdit(state.todo, e.currentTarget.value)
  else
    state.actions.onDestroy(state.todo)
  return { editing: false, input: title }
}

const ESC_KEY = 27

actions.onEditKeyDown = e => ({ todo: { title } }) => {
  if (e.keyCode === ESC_KEY)
    return { editing: false, input: title }
}

actions.onEditKeyUp = e => ({ editing, input }) => {
  if (editing)
    return { input: e.currentTarget.value }
}

export default view(({ todo: { title, completed }, editing, input }, actions) =>
  <li class={toggleClass({ todo: true, completed, editing })}>
    <div class="view">
      <input class="toggle" type="checkbox" checked={completed} onChange={actions.onComplete} />
      <label onDblClick={actions.onStartEdit}>{title}</label>
      <button class="destroy" onClick={actions.onDestroy}></button>
    </div>
    <input class="edit"
      value={input}
      focus={editing}
      onChange={actions.onDoneEdit}
      onBlur={actions.onDoneEdit}
      onKeyDown={actions.onEditKeyDown}
      onKeyUp={actions.onEditKeyUp}
    />
  </li>, state, actions)
