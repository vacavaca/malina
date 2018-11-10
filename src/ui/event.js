export const toOnEventName = event =>
  `on${event[0].toUpperCase()}${event.substr(1)}`


export const normalizeEventName = name => {
  const lower = name.toLowerCase()
  return lower.startsWith("on") ? lower.substr(2) : lower
}
