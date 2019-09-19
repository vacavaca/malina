import { Declaration } from '../vdom'

/**
 * View that simply renders its children,
 * useful when creating views with decorators.
 *
 * @example
 * const mount = () => {
 *  console.log('mounted!')
 * }
 *
 * const LogMount = withLifecycle({ mount })(Id)
 * // ...
 *
 * <LogMount>
 *  <h1>Hello</h1>
 * </LogMount>
 *
 * @example
 * <Id>
 *  <h1>Hello</h1>
 * </Id>
 * // renders: <h1>Hello</h1>
 */
export default new Declaration(({ children }) => children)
