import 'babel-polyfill'

import { h, view, Debug, withTemplate, withState, withActions, renameState } from 'malina'
import { webComponent } from 'malina-decorator'

const App = view(
  withTemplate(
    <template>
      <style>{`
      .app {
        font-family: sans-serif;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      .header {
        background-color: #f0f0f0;
        height: 10%;
        min-height: 60px;
        flex: 0 1 60px;
      }

      .content {
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex: 1 0 auto;
      }

      .wrap {
        flex: 0 1 50%;
      }

      .footer {
        flex: 0 1 60px;
        min-height: 60px;
        background-color: #f0f0f0;
      }
    `}</style>
      <div class="app">
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="content">
          <div class="wrap">
            <slot name="content"></slot>
          </div>
        </div>
        <div class="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </template>
  ),
  webComponent('x-app')
)

const Header = view(
  withTemplate(
    <template>
      <style>
        {`
      .header {
        text-align: center;
        padding-top: 20px;
      }
    `}
      </style>
      <div class="header">This is a header!</div>
    </template>
  ),
  webComponent('x-header')
)

const Footer = view(
  withTemplate(
    <template>
      <style>
        {`
      .footer {
        color: #444;
        text-align: center;
        padding-top: 20px;
      }
    `}
      </style>
      <div class="footer">This is a footer!</div>
    </template>
  ),
  webComponent('x-footer')
)

const Text = view(
  withTemplate(({ state, children }) =>
    <template>
      <style>{`
  p {
    color: red;
  }
  `}</style>
      <Debug info="content" counter={state['data-counter']} />
      <p>{children}</p>
      <b>One more counter: {state['data-counter']}</b>
    </template>
  ),
  webComponent('x-text', { observe: ['data-counter'] })
)

const Content = view(
  withTemplate(({ state, actions, children }) =>
    <template>
      <h1>Web Components</h1>
      <p>This is a basic example of Web Components in <b>malina</b>!</p>
      <p>Counter: {state.count}</p>
      <button onClick={actions.increment}>Click me!</button>
      <br />
      <x-text data-counter={state.count}>
        <div>
          {children}
        </div>
      </x-text>
    </template>
  ),
  withState(({ 'start-counting-with': startWith }) => ({ count: +startWith })),
  withActions({
    increment: () => ({ state: { count } }) => ({ count: count + 1 })
  }),
  webComponent('x-content')
)
