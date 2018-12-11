import { h, view } from 'malina'

import { default as Filter } from './filter'
import * as filter from './filter'
import { branch } from './util'

const countActive = todos =>
  todos.filter(({ completed }) => !completed).length

const itemsLeft = left => `item${left != 1 ? 's' : ''} left`

const actions = {}

actions.onDestroyCompleted = () => state => {
  state.actions.onDestroyCompleted()
}

export default view((state, actions) => {
  const left = countActive(state.todos)
  const completed = state.todos.length - left

  return <footer class="footer">
    <span class="todo-count"><strong>{left}</strong> {itemsLeft(left)}</span>
    <ul class="filters">
      <Filter
        actions={state.actions}
        key={filter.all}
        selected={state.filter}
        link="#/">All</Filter>
      <Filter
        actions={state.actions}
        key={filter.active}
        selected={state.filter}
        link="#/active">Active</Filter>
      <Filter
        actions={state.actions}
        key={filter.completed}
        selected={state.filter}
        link="#/completed">Completed</Filter>
    </ul>
    {branch(completed > 0,
      <button class="clear-completed" onClick={actions.onDestroyCompleted}>Clear completed</button>)}
  </footer>
}, {}, actions)
