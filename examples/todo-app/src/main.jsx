import { h, view, List } from 'malina'
import { withActions } from 'malina-decorator'

import Todo from './todo'

const isAllCompleted = ({ todos }) =>
  todos.every(({ completed }) => completed)

const onAllComplete = e => ({ state }) => {
  state.actions.onAllComplete(e.currentTarget.checked, state.filter)
}

export default view(({ state, actions }) =>
  <section class="main">
    <input
      id="toggle-all"
      class="toggle-all"
      type="checkbox"
      checked={isAllCompleted(state)}
      onChange={actions.onAllComplete}
    />
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list">
      <List data={state.todos} indexBy="id">{todo =>
        <Todo todo={todo} actions={state.actions} />
      }</List>
    </ul>
  </section>)
  .decorate(withActions({ onAllComplete }))
