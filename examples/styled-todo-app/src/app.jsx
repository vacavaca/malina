import { h, view, branch, withTemplate, withState, withActions, withLifecycle } from 'malina'
import { connectRouter, Route } from 'malina-router'
import { styled, withStyledTemplate } from 'malina-styled'

import Main from './main'
import Header from './header'
import Footer from './footer'
import { all, pathToFilter } from './filter'
import { loadTodosFromStorage, todosPeristence } from './persistence'
import { uuid } from './util'

import './global.css'

// function to load initial state from the localstorage
const state = () => ({
  todos: loadTodosFromStorage()
})

const actions = {}

actions.onAllComplete = (completed, filter) => ({ state: { todos } }) => ({
  todos: todos.map(todo => filter(todo) ? ({ ...todo, completed }) : todo)
})

actions.onComplete = (requestedTodo, completed) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, completed }) : todo)
})

actions.onEdit = (requestedTodo, title) => ({ state: { todos } }) => ({
  todos: todos.map(todo => todo === requestedTodo ? ({ ...todo, title }) : todo)
})

actions.onDestroy = (requestedTodo, title) => ({ state: { todos } }) => ({
  todos: todos.filter(todo => todo !== requestedTodo)
})

actions.onCreate = title => ({ state: { todos } }) => ({
  todos: todos.concat([{ title, completed: false, key: todos.length, id: uuid() }])
})

actions.onDestroyCompleted = () => ({ state: { todos } }) => ({
  todos: todos.filter(({ completed }) => !completed)
})

const behavior = view => {

  view.onUpdate(({ state: { todos } }) => persistTodos(todos))
}

const Section = styled.section`
background: #fff;
margin: 130px 0 40px 0;
position: relative;
box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            0 25px 50px 0 rgba(0, 0, 0, 0.1);
`

const update = view => {
  view.state.persistTodos(view.state.todos)
}

const TodoApp = view(
  withStyledTemplate(({ state: { todos, filter }, actions }) => (
    <Section>
      <Header actions={actions} />
      {branch(todos.length > 0,
        <Main todos={todos.filter(filter)} actions={actions} filter={filter} />)}
      {branch(todos.length > 0,
        <Footer filter={filter} todos={todos} actions={actions} />)}
    </Section>

  )),
  withState(state),
  withActions(actions),
  withLifecycle({ update })
)

const create = view => {
  view.state.persistTodos = todosPeristence()

  const { location, router } = view.state
  if (!location.hash)
    router.replace('/#/')
}

const template = ({ state: { persistTodos }, actions }) =>
  <Route hash path="#/:filter?">{
    urlParams => {
      const filter = pathToFilter(urlParams.filter)
      return <TodoApp filter={filter} persistTodos={persistTodos} />
    }}
  </Route>

export default view(
  withStyledTemplate(template),
  connectRouter(),
  withLifecycle({ create })
)
