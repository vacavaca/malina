class Declaration {
  constructor(template, state, actions, hooks) {
    this.template = template
    this.state = state
    this.actions = actions
    this.hooks = hooks
  }
}

export const view = (template, state = null, actions = null, hooks = null) =>
  new Declaration(template instanceof Function ? template : () => template, state, actions, hooks)

export const ViewDeclaration = Declaration
