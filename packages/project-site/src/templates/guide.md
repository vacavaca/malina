# Guide

## Installation

Just add malina to your project:

```
npm install --save malina
```

## Getting Started

An example is worth a thousand words

```jsx
import { h, view, mount } from 'malina'

const state = {
  counter: 0
}

const actions = {
  click: () => state => ({ counter: state.counter + 1 })
}

const App = view((state, actions) => (
  <div> 
    <p>Clicked: {state.counter} times!</p>
    <button onClick={actions.click}>Click me</button>
  </div>
), state, actions)

mount(document.body, <App />)

```

This minimalistic example actually contains all the functions usually needed to solve most of the tasks, let's examine them in more detail

There are few functions imported here to set up the application:

> **h** (**tag**: *string|Object*, **attrs**: *Object*, **children**: *Array*) -> *Object*

The **h** function is needed to create vDOM nodes, if you prefer JSX syntax then babel must be configured accordingly, here is an example of the .babelrc file:

```json
{
  "plugins": [["@babel/plugin-transform-react-jsx", { "pragma": "h" }]]
}
```

Or you can do without jsx:

```js
h('div', {}, [
  h('p', {}, 'Hello world'),
  h(App, { counter: 42 }),
])
```


> **view** (**tempalte**: \*, **state**: *Object|Function*, **actions**: *Object|Function*, **hooks**: *Object|Function*) -> *Object*

**view** is needed to declare UI components, its template, state, actions and hooks, it is the main building block of applications, so let's take a more detailed look at its arguments.

### Template

**template** - used to map state and actions on to the markup, it can be `null`, `string`, vDOM node, or a function that takes current view's **state**, **actions** and **children** in arguments

Here is an example of it:
```jsx
view((state, actions, children) =>
    <button class="btn" onClick={actions.handleClick}>
        {children}
    </button>
), ...)
```

or it can be just a vDOM node

```jsx
view(
    <section>
        <h1>Hello, malina!</h1>
    </section>
)
```

### State
The second argument of the `view` function is **state**. It is an initial state of the view, it can be an `Object` or a `Function` that takes attributes passed to the vDOM node as an argument

State as an object:
```jsx
const state = {
    greeting: 'Howdy stranger!'
}

const WelcomeText = view(state => <p>{state.greeting}</p>, state)

const App = view(<WelcomeText />)
```

State as a function:

```jsx
const state = props => ({
    greeting: `Hello, ${props.name}!`
})

const WelcomeText = view(state = <p>{state.greeting}</p>, state)

const App = view(
    <WelcomeText name="John" />
)
```


### Actions

**actions** is a set of functions that allows us to change view's state. Actions can be written in many different forms with the same global pattern:

```js
const actions = {
    /**
     * Action takes arbutrary arguments returning a function that can
     * update the state or call other actions
     */
    increment: value => (state, actions) => ({ counter: state.counter })
}
```

An action can be asynchronous:
```js
const actions = {}

actions.submit = data => async (state, actions) => {
    await fetch(...)
    return { submitted: true }
}
```

or it may not update the state:
```js
actions.submit = data => (_, actions) => {
    actions.clearForm()
    actions.showLoader()
    actions.ajaxSendData(data)
}
```

or it may update the state but not update the view 

```js
actions.doOffStateUpdate = value => state => {
    state.someAuxField = value
}
```

Doing so is a bit dangerous and it's recommended to return an update object from actions as normal but it rarely can be useful for optimisation purposes.

### Hooks

Last but not least argument to the view function is **hooks** object. Hooks are used to control the view's lifecycle. Each hook takes in arguments the DOM node in which the view was rendered, view's current state and its actions:

```js
const hooks = {
    /**
     * Called after the view's initialisation.
     *
     * `element` argument is always null here because the view wasn't mounted yet
     */
    create: (element, state, actions) => { /*...*/ },
    
    /**
     * Called after the view was mounted.
     */
    mount: (element, state, actions) => { /*...*/ },
    
    /**
     * Called after each update
     */
    update: (element, state, actions) => { /*...*/ },
    
    /**
     * Called after the view was unmounted
     * 
     * `element` is null here
     */
    unmount: (element, state, actions) => { /*...*/ }
    
    /**
     * Called after the view was destroyed completely
     * 
     * `element` is null here
     */
    unmount: (element, state, actions) => { /*...*/ }
}
```

*Note* that if you just need to access the DOM of the view it's beter to use the [withRefs]() decorator.

### Mounting Views

The last line of our example was:

```js
mount(document.body, <App />)
```

The **mount** function mounts the vDOM into the real DOM tree. It takes:
* **container** - DOM element into which the node will be rendered
* **node** - vDOM node to render
* **index** - numeric index at which the node will be rendered *(optional)*
* **options** - mounting options *(optional)*
    * *insideSvg* - boolean flag, set it to `true` if you're rendering your tree inside an svg tag
    
You can mount as many nodes as you want, you can even mount new views from other views' actions and hooks, but an attempt to mount something from the outside into the view's tree may lead to the broken markup

*Note* that **container** element is not required to be a real HTMLElement, you can use other DOM implementations as well such as [jsdom](https://github.com/jsdom/jsdom). It can be really useful for [SSR]() and [Testing]()

The **mount** function returns a *view* instance, it's an object that has **state** and **actions** properties and you can manipilate them as you need:

```jsx
const app = mount(document.body, <App />)

app.actions.doAwesomeStuff()
```

## Examples
Check out the [examples](https://github.com/vacavaca/malina/blob/master/examples) directory of the project to see how to write more complex applications such are:

### [Todo App](https://github.com/vacavaca/malina/blob/master/examples/todo-app)
The reference implementation of the [TodoMVC](http://todomvc.com) app, here you can find:

* An example of a simple project structure
* How to pass state and actions down the tree
* How to manage global state and save it to the localStorage
* How to work with router

## [Snake Game](https://github.com/vacavaca/malina/blob/master/examples/todo-app)
A simple [snake](https://en.wikipedia.org/wiki/Snake_(video_game_genre)) game, contains examples of:
* A more complex project structure
* *SVG* views
* *SASS* (scss) integration
* Working with DOM using the [withRefs]() decorator


*Contributions are welcome*!

## Constraints and Limitations

The great simplicity of this library internals  comes with a little cost and that cost is reflected in some limitations of the usage, here they are:

1. *Each view must end up rendering a single DOM element*

    It's impossible to render multiple elements or multiple views:

    ```jsx
    // This won't work
    const App = view(
        {[
            <li>First</li>,
            <li>Second</li>
        ]}
    )
    ```
    
    But is allowed to render just a view without DOM:
    
    ```jsx
    // It's ok, we can pass multiple elements to view's children as well
    const App = view(
        <OtherView>
            <li>First</li>
            <li>Second</li>
        <OtherView />
    )
    ```
    
    In this example `App` and `OtherView` will probably share a single DOM Element

2. *The only way to access or change the view state is via its **actions** and **hooks**, except when the view was mounted using the **mount** function*

    There is one important consequence of this rule:

    **You cannot call actions of your child views**, there are workarounds but if you need to do so it's probable that you have some flaws in your design, try to refactor your data flow a bit.

That's it for the limitations but here are few more important notes to consider:

1. Remember that your UI code must stay purely declarative. That means you cannot access the view's state or actions unless you're "inside" the view's scope, it also means that you cannot "know" when and where your views will end up rendering, and can not control it from the view's definitions. 
2. Do not relly on the template function as an indicator for updates, use the **update** hook if necessary.
3. [Keep It Simple](https://en.wikipedia.org/wiki/KISS_principle)! Keep your views, state and actions small, separate it into multiple functions or even files if needed. Remember that it's better to [contain](https://en.wikipedia.org/wiki/Composition_over_inheritance) things one inside another than to extend it via inheritance or modifications from the outside. 

## Comparison with other Frameworks

First, it's important to mention that [malina](https://github.com/vacavaca/malina) is more like a "library" than a framework, it has a very little [Inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) i.e. it gives more control of the program flow to the user and it only manages rendering and state updates. The other thing that separates it from other large-scale frameworks is the size: it contains a very limited set of functions, providing the "core" functionality for building user interfaces so if you need a tool to build an application using a big set of predefined components, widgets, and modules then maybe malina is not a perfect fit, but if you're willing to develop a robust and efficient app taking full control of the all of its parts then this library is here for you.

In the following paragraphs this library is compared with other popular tools, keep in mind that this is a subjective author's opinion, and it can be a bit biased sometimes. If you find a mistake here or think that some information is outdated, or you think that author misunderstands some concepts, please, let us known by opening an issue or you can suggest an edit to this guide, your feedback is very welcome! 

### JS Micro-frameworks

[hyperapp](https://github.com/jorgebucaran/hyperapp) is the closest analog for this library, it has very similar public interface and was writen in the same time period (independently) as malina, but for now (v1, late 2018) it lacks some crucial functions needed to build complex applications:

* No support for multiple stateful views in a template, composition of views is possible but messy.
    
    On the other side, in malina, multiple views are fully supported, it goes even further: optimisation for keyed (indexed) colletions in malina is written using only view composition, not touching the rendering core.
    
* Missing DOM utilities

    Working with DOM in hyperapp is possible using the native DOM API, but it's very usefull to have some utilities to access DOM nodes of the specific parts of the template without the need to manualy search the DOM tree using the low-level API
    
    Malina has [refs]() and [hooks](#hooks) for that
    
* General design goals

    Based on the [V2 discussions](https://github.com/jorgebucaran/hyperapp/pull/726) overall design vision of the hyperapp is at odds with that in malina. Malina's main focus is at providing the core functionality giving the necessary primitives and flexibility to other [packages](https://github.com/vacavaca/malina/blob/master/packages) and libraries to develop more abstract and high-level APIs and tools. The public API will unlikely be changed, all the modern framework magic can be arcived using this simple but powerful API.

[mithril.js](https://mithril.js.org/) is another beautiful library. It can perfectly fit many needs of the modern web development and it shares a lot of concepts with malina:

* Both use virtual DOM
* Both has view-library core along with some more high-level features (routing for example)
* Both has similar aproach to code organisation

But there are some differences:

* malina has more abstract, functional interface
* malina use [decorators]() as a primary tool for extending components. *Not to be confused with the [decorators proposal](https://github.com/tc39/proposal-decorators)*
* malina has actions and hooks as are built-ins in its interface


Lastly, [redom](https://redom.js.org), [monkberry](https://monkberry.js.org/), and [many other tools](https://github.com/search?l=JavaScript&q=microframework&type=Repositories) can be considered as a replacement for malina, all have many similarities and they definatelly worth taking a look. But an in-detail comparison is out of scope of this guide. 


### [React](http://reactjs.org/)

React shares a lot with malina, they both was built with almost identical ideas in mind, and malina could be considered as the *essence of the react*. However, there are some differences, mostly in design, that makes malina more suitable in many cases:

* The size. Malina is far smaller than react, incomparably smaller, ~ **1k** in malina vs ~ **17k** lines of code in react (react and react-dom excluding tests)
* The components API. React was initially built around the concept of classes, objects, and inheritance, on the other side, malina is more functional and declarative. Currently, React is changing towards more functional approach (with [hooks](https://reactjs.org/docs/hooks-intro.html) for example), but for now a lot of code in real applications must be written using classes. Classes in React are frequently a lot more verbose than malina or similar tools and they also make it harder to separate components' state and "actions" from the template.
* Lifecycle API. React has a big and a bit overloaded set of lifecycle methods, some of them are presented in malina as well ([hooks](#hooks)) but some of them are missing and, if needed, can be easily replaced with view composition and decorators, so malina is more simple and flexible in this regard.
* Hooks and Effects. Those are the new APIs in React and malina has the same functinality too, but the react’s APIs have more  inversion of the program flow in them, it's somethimes referred as "magic" in the code. Somebody may like it but in malina the main goal is to provide more transparent and comprehensible API that both simblifies application development and increases code maintainability.
* Because React is a "view-library" you are usually have to include other tools in your project, such as state management tool, router, styling tool etc. In malina many of such tools are already presented in the companion [pacakges](), so you don't need to depend on third-party libraries. This approach increases consistency in code and simplifies onboarding process in teams, but if you really need to use third-party tools (for example [redux](https://redux.js.org) as state-management) you are free to do so.

### [Vue](https://vuejs.org)

Vue has a completely different API and design concepts than malina, so it's out of scope to compare them in depth, but here are some key differences:

* Malina uses JSX templates with the implementation inspired by React and hyperscript. Vue utilities its own template syntax.
* Malina has no concept of "binding" and watchers. The state is propagated downwards in purely functional way.
* Malina uses decorators and functional composition for extending components. Vue has plugins and mixins for that.

Comparison with other popular tools will be added soon as a separate section of the docs.

### Performance Comparison

Almost all UI tools today has a similar performance and in most cases that is enough to satisfy modern needs of speed and responsiveness in web applications. In many cases the problems with performance come from the user's code and they can be handled optimising algorithms, style, markup, and animations. But, for your reference, complete benchmarks of malina compared to many other popular tools will be released soon.

If you are interested in performance optimisations in malina take a look at the [Performance]() page.


## Advanced Topics
* [Decorators]()
* [Routing]()
* [Server Side Rendering]()
* [Performance]()
* [Testing]()

## Further Reading

* [API Reference]()
* [Changelog](https://github.com/vacavaca/malina/blob/master/CHANGELOG.md)
* [Contribution](https://github.com/vacavaca/malina/blob/master/CONTRIBUTING.md)

