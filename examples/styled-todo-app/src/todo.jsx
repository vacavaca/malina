import { h, view, withState, withActions } from 'malina'
import { styled, withStyledTemplate, only } from 'malina-styled'

import Input from './input'
import Button from './button'

const state = {
  todo: null,
  editing: false,
  input: ''
}

const actions = {}

actions.onComplete = e => ({ state }) => {
  state.actions.onComplete(state.todo, e.currentTarget.checked)
}

actions.onDestroy = () => ({ state }) => {
  state.actions.onDestroy(state.todo)
}

actions.onStartEdit = e => ({ state }) =>
  ({ editing: true, input: state.todo.title })

actions.onDoneEdit = e => ({ state }) => {
  if (!state.editing)
    return

  const title = e.currentTarget.value.trim()
  if (title.length > 0)
    state.actions.onEdit(state.todo, e.currentTarget.value)
  else
    state.actions.onDestroy(state.todo)
  return { editing: false, input: title }
}

const ESC_KEY = 27

actions.onEditKeyDown = e => ({ state }) => {
  if (e.keyCode === ESC_KEY)
    return { editing: false, input: state.todo.title }
}

actions.onEditKeyUp = e => ({ state }) => {
  if (state.editing)
    return { input: e.currentTarget.value }
}

const Todo = styled.li`
position: relative;
font-size: 24px;
border-bottom: 1px solid #ededed;

:last-child {
	border-bottom: none;
}

${only('editing', `
	border-bottom: none;
  padding: 0;
  
  &:last-child {
    margin-bottom: -1px;
  }
`)}

:hover .destroy {
	display: block;
}
`

const View = styled.div`
${only('editing', ` display: none; `)}
`

const EditInput = styled(Input)`
position: relative;
margin: 0;
width: 100%;
font-size: 24px;
font-family: inherit;
font-weight: inherit;
line-height: 1.4em;
border: 0;
color: inherit;
padding: 6px;
border: 1px solid #999;
box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
box-sizing: border-box;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
display: none;

${only('editing', `
display: block;
width: 506px;
padding: 12px 16px;
margin: 0 0 0 43px;
`)}
`

const ToggleInput = styled(Input)`
text-align: center;
width: 40px;
/* auto, since non-WebKit browsers doesn't support input styling */
height: auto;
position: absolute;
top: 0;
bottom: 0;
margin: auto 0;
border: none; /* Mobile Safari */
-webkit-appearance: none;
appearance: none;
opacity: 0;

& + label {
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E');
	background-repeat: no-repeat;
	background-position: center left;
}

&:checked + label {
  background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E');
}

@media screen and (-webkit-min-device-pixel-ratio:0) {
		background: none;
		height: 40px;
	}
}
`

const Label = styled.label`
word-break: break-all;
padding: 15px 15px 15px 60px;
display: block;
line-height: 1.2;
transition: color 0.4s;

${only('completed', `
color: #d9d9d9;
text-decoration: line-through;
`)}
`

const DestroyButton = styled(Button)`
	display: none;
	position: absolute;
	top: 0;
	right: 10px;
	bottom: 0;
	width: 40px;
	height: 40px;
	margin: auto 0;
	font-size: 30px;
	color: #cc9a9a;
	margin-bottom: 11px;
  transition: color 0.2s ease-out;
  
  :hover {
    color: #af5b5e;
  }

  :after {
    content: '×';
  }
`

export default view(
  withStyledTemplate(({ state, actions }) =>
    <Todo $completed={state.todo.completed} $editing={state.editing}>
      <View $editing={state.editing}>
        <ToggleInput type="checkbox" checked={state.todo.completed} onChange={actions.onComplete} />
        <Label $completed={state.todo.completed} onDblClick={actions.onStartEdit}>{state.todo.title}</Label>
        <DestroyButton class="destroy" onClick={actions.onDestroy}></DestroyButton>
      </View>
      <EditInput
        $editing={state.editing}
        value={state.input}
        focus={state.editing}
        onChange={actions.onDoneEdit}
        onBlur={actions.onDoneEdit}
        onKeyDown={actions.onEditKeyDown}
        onKeyUp={actions.onEditKeyUp}
      />
    </Todo>
  ),
  withState(state),
  withActions(actions)
)
