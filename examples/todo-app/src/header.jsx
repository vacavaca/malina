import { h, view, withActions, withTemplate } from 'malina'

/**
 * Creates new todo, calling app actions
 * 
 * @param {*} e input change event 
 * @returns {function} action
 */
const onCreate = e => ({ state }) => {
  const title = e.currentTarget.value.trim()
  if (title.length > 0) {
    state.actions.onCreate(e.currentTarget.value)
  }

  e.currentTarget.value = ""
}

export default view(
  withTemplate(({ actions }) =>
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        focus
        onChange={actions.onCreate}
      />
    </header>),
  withActions({ onCreate })
)
