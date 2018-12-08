import { h, view } from 'malina'
import { Route, Link } from 'malina-router'

import { toggleClass } from './util'

export const active = todo => !todo.completed

export const completed = todo => todo.completed

export const all = () => true

const filterPaths = { active, completed, '': all }

export const pathToFilter = path => filterPaths[path] || all

export const filterToPath = filter => Object.keys(filterPaths).find(key => filterPaths[key] === filter)

const filterClass = (filter, selected) =>
  toggleClass({ selected: filter === selected })

export default view(({ key: filter }, _, children) =>
  <Route hash path="#/:filter?">
    {params => (
      <li>
        <Link
          to={`#/${filterToPath(filter)}`}
          class={filterClass(filter, pathToFilter(params.filter))}
        >{children}</Link>
      </li>
    )}
  </Route>)
