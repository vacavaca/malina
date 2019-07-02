import { h } from 'malina'
import { Route, Link } from 'malina-router'
import { styled, styledTemplate, only } from 'malina-styled'

export const active = todo => !todo.completed

export const completed = todo => todo.completed

export const all = () => true

const filterPaths = { active, completed, '': all }

export const pathToFilter = path => filterPaths[path] || all

export const filterToPath = filter => Object.keys(filterPaths).find(key => filterPaths[key] === filter)

const Filter = styled.li`
display: inline;
`

const FilterLink = styled.a`
color: inherit;
margin: 3px;
padding: 3px 7px;
text-decoration: none;
border: 1px solid transparent;
border-radius: 3px;

:hover {
	border-color: rgba(175, 47, 47, 0.1);
}

${only('selected', `
border-color: rgba(175, 47, 47, 0.2);
`)}
`

export default styledTemplate(({ state: { key: filter }, children }) =>
  <Route hash path="#/:filter?">
    {params => (
      <Filter>
        <Link
          view={FilterLink}
          $selected={filter === pathToFilter(params.filter)}
          to={`#/${filterToPath(filter)}`}
        >{children}</Link>
      </Filter>
    )}
  </Route>)
