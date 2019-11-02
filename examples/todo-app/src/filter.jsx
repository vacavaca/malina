import { h, template } from 'malina'
import { Route, Link } from 'malina-router'

import { toggleClass } from './util'

/**
 * Filter with active todos
 * 
 * @param {Object} todo todo
 * @returns {boolean} true if todo is not completed 
 */
export const active = todo => !todo.completed

/**
 * Filter with completed todos
 * 
 * @param {Object} todo todo 
 * @returns {boolean} true if todos is completed
 */
export const completed = todo => todo.completed

/**
 * Filter with all todos
 * 
 * @returns {boolean} true
 */
export const all = () => true

const filterPaths = { active, completed, '': all }

/**
 * Get filter function by url path (or hash path)
 * 
 * @param {string} path url path (or hash path) 
 * @returns {function} filter function
 */
export const pathToFilter = path => filterPaths[path] || all

/**
 * Get url path (or hash pasth) by filter function
 * 
 * @param {function} filter function 
 * @returns {string} path
 */
export const filterToPath = filter => Object.keys(filterPaths).find(key => filterPaths[key] === filter)

const filterClass = (filter, selected) =>
  toggleClass({ selected: filter === selected })

export default template(({ state: { key: filter }, children }) =>
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
