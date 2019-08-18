const { Suite } = require('../util')
const { JSDOM } = require('jsdom')
const { h, view, mount, withTemplate, withActions, withState } = require('../..')

module.exports = new Suite()
  .add('update simple list',
    ctx => {
      ctx.Test = view(
        withTemplate(({ state }) => h('ul', {}, state.todos.map(todo =>
          h('li', { class: 'todo' }, [
            h('p', {}, [todo.name])
          ]))
        )),
        withState({
          i: 0,
          todos: [
            { name: 'first' },
            { name: 'test 0' },
            { name: 'last' }
          ]
        }),
        withActions({
          update: () => ({ state }) => ({
            i: state.i + 1,
            todos: [state.todos[0], { name: `test ${state.i + 1}` }, state.todos[2]]
          })
        })
      )

      ctx.dom = new JSDOM('<body></body>')
      ctx.instance = mount(ctx.dom.window.document.body, h(ctx.Test))
    },
    ctx => {
      ctx.instance.actions.update()
    },
    ctx => {
      console.log('Result: ', ctx.dom.window.document.body.innerHTML)
    })
  .add('render same markup',
    ctx => {
      ctx.Test = view(
        withTemplate(() =>
          h('ul', {}, [
            h('li', { class: 'todo' }, [
              h('p', {}, ['First'])
            ]),
            h('li', { class: 'todo' }, [
              h('p', {}, ['Second'])
            ]),
            h('li', { class: 'todo' }, [
              h('p', {}, ['Third'])
            ])
          ]
          )
        ),
        withState({ i: 0 }),
        withActions({
          update: () => ({ state }) => ({ i: state.i + 1 })
        })
      )

      ctx.dom = new JSDOM('<body></body>')
      ctx.instance = mount(ctx.dom.window.document.body, h(ctx.Test))
    },
    ctx => {
      ctx.instance.actions.update()
    },
    ctx => {
      console.log('Result: ', ctx.dom.window.document.body.innerHTML)
    })
  .tests
