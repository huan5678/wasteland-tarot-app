import { logEvent } from './logger'

export type UserAction =
  | 'reading:view_detail'
  | 'reading:toggle_favorite'
  | 'reading:delete'
  | 'reading:create'
  | 'spread:select'
  | 'app:login'
  | 'app:logout'

export function track(action: UserAction, payload?: any) {
  logEvent(action, payload)
}
