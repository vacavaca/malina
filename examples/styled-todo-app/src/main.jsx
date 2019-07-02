import { h, view, List } from 'malina'
import { withActions } from 'malina-decorator'
import { styled, withStyledTemplate } from 'malina-styled'

import Todo from './todo'
import Input from './input'

const isAllCompleted = ({ todos }) =>
  todos.every(({ completed }) => completed)

const onAllComplete = e => ({ state }) => {
  state.actions.onAllComplete(e.currentTarget.checked, state.filter)
}

const MainSection = styled.section`
position: relative;
z-index: 2;
border-top: 1px solid #e6e6e6;
`

const ToggleAllInput = styled(Input)`
width: 1px;
height: 1px;
border: none; /* Mobile Safari */
opacity: 0;
position: absolute;
right: 100%;
bottom: 100%;

& + label {
	width: 60px;
	height: 34px;
	font-size: 0;
	position: absolute;
	top: -52px;
	left: -13px;
	-webkit-transform: rotate(90deg);
  transform: rotate(90deg);

  &:before {
    content: '❯';
    font-size: 22px;
    color: #e6e6e6;
    padding: 10px 27px 10px 27px;
  }
}

&:checked + label:before {
	color: #737373;
}

@media screen and (-webkit-min-device-pixel-ratio:0) {
		background: none;
}
`

const TodoList = styled.ul`
margin: 0;
padding: 0;
list-style: none;
`

export default view(
  withStyledTemplate(({ state, actions }) =>
    <MainSection>
      <ToggleAllInput
        id="toggle-all"
        type="checkbox"
        checked={isAllCompleted(state)}
        onChange={actions.onAllComplete}
      />
      <label for="toggle-all">Mark all as complete</label>
      <TodoList>
        <List data={state.todos} indexBy="id">{
          todo => <Todo todo={todo} actions={state.actions} />
        }</List>
      </TodoList>
    </MainSection>),
  withActions({ onAllComplete })
)
