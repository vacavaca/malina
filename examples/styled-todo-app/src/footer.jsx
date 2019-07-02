import { h, branch } from 'malina'
import { styled, styledTemplate } from 'malina-styled'

import { default as Filter } from './filter'
import * as filter from './filter'
import Button from './button'

const countActive = todos =>
  todos.filter(({ completed }) => !completed).length

const itemsLeft = left => `item${left != 1 ? 's' : ''} left`

const Footer = styled.footer`
color: #777;
padding: 10px 15px;
height: 20px;
text-align: center;
border-top: 1px solid #e6e6e6;

:before {
	content: '';
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	height: 50px;
	overflow: hidden;
	box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
	            0 8px 0 -3px #f6f6f6,
	            0 9px 1px -3px rgba(0, 0, 0, 0.2),
	            0 16px 0 -6px #f6f6f6,
	            0 17px 2px -6px rgba(0, 0, 0, 0.2);
}

@media (max-width: 430px) {
  height: 50px;
}
`

const FiltersList = styled.ul`
margin: 0;
padding: 0;
list-style: none;
position: absolute;
right: 0;
left: 0;

@media (max-width: 430px) {
  bottom: 10px;
}
`

const TodoCount = styled.span`
float: left;
text-align: left;

strong {
	font-weight: 300;
}
`

const ClearCompleted = styled(Button)`
&, &.active {
  float: right;
	position: relative;
	line-height: 20px;
	text-decoration: none;
	cursor: pointer;
}

:hover {
  text-decoration: underline;
}
`

export default styledTemplate(({ state }) => {
  const left = countActive(state.todos)
  const completed = state.todos.length - left

  return <Footer>
    <TodoCount><strong>{left}</strong> {itemsLeft(left)}</TodoCount>
    <FiltersList>
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
    </FiltersList>
    {branch(completed > 0,
      <ClearCompleted onClick={state.actions.onDestroyCompleted}>Clear completed</ClearCompleted>)}
  </Footer>
})
