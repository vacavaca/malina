import { h, view, List, withActions, withTemplate } from 'malina'

import Todo from './todo'

/**
 * Check if all todos are completed
 * 
 * @param {Object} state view state 
 * @returns {boolean} true if all todos are completed
 */
const isAllCompleted = ({ todos }) =>
  todos.every(({ completed }) => completed)

/**
 * Set all todos completed
 * 
 * @param {*} e event
 * @returns {function} action
 */
const onAllComplete = e => ({ state }) => {
  state.actions.onAllComplete(e.currentTarget.checked, state.filter)
}

export default view(
  withTemplate(({ state, actions }) =>
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
        <List data={state.todos} indexBy="id">{
          todo => <Todo todo={todo} actions={state.actions} />
        }</List>
      </ul>
    </section>),
  withActions({ onAllComplete })
)
