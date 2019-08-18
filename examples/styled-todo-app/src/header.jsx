import { h, view, withActions } from 'malina'
import { styled, withStyledTemplate } from 'malina-styled'

import Input from './input'

const Title = styled.h1`
	position: absolute;
	top: -155px;
	width: 100%;
	font-size: 100px;
	font-weight: 100;
	text-align: center;
	color: rgba(175, 47, 47, 0.15);
	-webkit-text-rendering: optimizeLegibility;
	-moz-text-rendering: optimizeLegibility;
	text-rendering: optimizeLegibility;
`

const NewTodoInput = styled(Input)`
position: relative;
margin: 0;
width: 100%;
font-size: 24px;
font-family: inherit;
font-weight: inherit;
line-height: 1.4em;
color: inherit;
border: 1px solid #999;
box-sizing: border-box;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
padding: 16px 16px 16px 60px;
border: none;
background: rgba(0, 0, 0, 0.003);
box-shadow: inset 0 -2px 1px rgba(0,0,0,0.03);
`

const onCreate = e => ({ state }) => {
  const title = e.currentTarget.value.trim()
  if (title.length > 0) {
    state.actions.onCreate(e.currentTarget.value)
  }

  e.currentTarget.value = ""
}

export default view(
  withStyledTemplate(({ actions }) =>
    <header class="header">
      <Title>todos</Title>
      <NewTodoInput
        placeholder="What needs to be done?"
        autofocus
        onChange={actions.onCreate}
      />
    </header>),
  withActions({ onCreate })
)
