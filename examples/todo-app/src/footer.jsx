import { h, view, branch } from 'malina'

import { default as Filter } from './filter'
import * as filter from './filter'

const countActive = todos =>
  todos.filter(({ completed }) => !completed).length

const itemsLeft = left => `item${left != 1 ? 's' : ''} left`

export default view(({ state }) => {
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
      <button class="clear-completed" onClick={state.actions.onDestroyCompleted}>Clear completed</button>)}
  </footer>
})
