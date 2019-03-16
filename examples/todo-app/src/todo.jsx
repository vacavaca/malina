import { h, view } from 'malina'
import { withState, withActions } from 'malina-decorator'

import { toggleClass } from './util'

const state = {
  todo: null,
  editing: false,
  input: ''
}

const actions = {}

actions.onComplete = e => ({ state }) => {
  state.actions.onComplete(state.todo, e.currentTarget.checked)
}

actions.onDestroy = () => ({ state }) => {
  state.actions.onDestroy(state.todo)
}

actions.onStartEdit = e => ({ state }) =>
  ({ editing: true, input: state.todo.title })

actions.onDoneEdit = e => ({ state }) => {
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

actions.onEditKeyDown = e => ({ state }) => {
  if (e.keyCode === ESC_KEY)
    return { editing: false, input: state.todo.title }
}

actions.onEditKeyUp = e => ({ state }) => {
  if (state.editing)
    return { input: e.currentTarget.value }
}

export default view(({ state, actions }) =>
  <li class={toggleClass({ todo: true, completed: state.todo.completed, editing: state.editing })}>
    <div class="view">
      <input class="toggle" type="checkbox" checked={state.todo.completed} onChange={actions.onComplete} />
      <label onDblClick={actions.onStartEdit}>{state.todo.title}</label>
      <button class="destroy" onClick={actions.onDestroy}></button>
    </div>
    <input class="edit"
      value={state.input}
      focus={state.editing}
      onChange={actions.onDoneEdit}
      onBlur={actions.onDoneEdit}
      onKeyDown={actions.onEditKeyDown}
      onKeyUp={actions.onEditKeyUp}
    />
  </li>)
  .decorate(
    withState(state),
    withActions(actions)
  )
