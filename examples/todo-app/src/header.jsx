import { h, view, withActions, withTemplate } from 'malina'

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
        autofocus
        onChange={actions.onCreate}
      />
    </header>),
  withActions({ onCreate })
)
