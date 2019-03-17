/* eslint-disable no-undef */
const assert = require('assert')
const { JSDOM } = require('jsdom')
const { h, view, mount, Debug } = require('..')

describe('Debug', () => {
  it('should log component lifecycle', () => {
    const dom = new JSDOM(`<body></body>`)

    const logs = []
    const logger = (...args) => logs.push(args)

    const Inner = view(({ state }) =>
      h('span', {}, [
        h(
          Debug,
          {
            logger,
            info: 'test-component',
            data: state.text
          }
        ),
        state.text
      ]))

    const behavior = view => {
      view.state = { text: 'Lorem ipsum' }
    }

    const actions = {
      update: () => ({ text: 'Updated' })
    }

    const View = view(({ state }) => h('div', { class: 'test' }, h(Inner, { text: state.text })), behavior, actions)
    const instance = mount(dom.window.document.body, h(View))

    const debugParent = dom.window.document.body.childNodes[0].childNodes[0]

    instance.actions.update()

    assert.strictEqual(logs.length, 3)

    const [createMsg, createData] = logs[0]
    const [mountMsg, mountData] = logs[1]
    const [updateMsg, updateData] = logs[2]

    assert.strictEqual(createMsg, 'DEBUG: created "test-component"')
    assert.strictEqual(mountMsg, 'DEBUG: mounted "test-component"')
    assert.strictEqual(updateMsg, 'DEBUG: updated "test-component"')

    assert.deepStrictEqual(createData, { state: { info: 'test-component', data: 'Lorem ipsum' } })
    assert.deepStrictEqual(mountData, { state: { info: 'test-component', data: 'Lorem ipsum' }, element: { parent: debugParent, index: 0 } })
    assert.deepStrictEqual(updateData, { state: { info: 'test-component', data: 'Updated' }, update: { data: 'Updated' }, element: { parent: debugParent, index: 0 } })

    instance.destroy()

    assert.strictEqual(logs.length, 5)

    const [unmountMsg, unmountData] = logs[3]
    const [destroyMsg] = logs[4]

    assert.strictEqual(unmountMsg, 'DEBUG: unmounted "test-component"')
    assert.strictEqual(destroyMsg, 'DEBUG: destroyed "test-component"')

    assert.deepStrictEqual(unmountData, { state: { info: 'test-component', data: 'Updated' }, element: { parent: debugParent, index: 0 } })

    assert.strictEqual(dom.window.document.body.childNodes.length, 0)
  })

  it('should disappear in production environment', () => {
    const dom = new JSDOM(`<body></body>`)

    const Inner = view(({ state }) =>
      h('span', {}, [
        h(
          Debug,
          {
            info: 'test-component',
            data: state.text
          }
        ),
        state.text
      ]))

    const View = view(({ state }) => h('div', { class: 'test' }, h(Inner, { text: state.text })))
    const instance = mount(dom.window.document.body, h(View, { text: 'Lorem ipsum' }), 0, { env: 'blah' })

    assert.strictEqual(dom.window.document.body.childNodes[0].childNodes[0].childNodes.length, 1)
    assert.strictEqual(dom.window.document.body.innerHTML, '<div class="test"><span>Lorem ipsum</span></div>')

    instance.destroy()
    assert.strictEqual(dom.window.document.body.childNodes.length, 0)
  })
})
