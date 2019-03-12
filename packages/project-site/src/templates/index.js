import { keyMirror } from '../util'

export const imports = {
  'guide': import('./guide'),
  'changelog': import('./changelog'),
}

export const names = keyMirror(imports)
