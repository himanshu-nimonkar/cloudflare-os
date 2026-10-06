// @vitest-environment jsdom
/* eslint-disable react/react-in-jsx-scope */
import { act, forwardRef, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => '/',
  Link: forwardRef<HTMLAnchorElement, { to: string; children?: ReactNode }>(
    ({ to, children, ...props }, ref) => <a ref={ref} href={to} {...props}>{children}</a>,
  ),
}))
vi.mock('../UserMenu', () => ({ default: () => null }))
vi.mock('../../ThemeContext', () => ({ useTheme: () => ({ themeMode: 'system', resolvedThemeMode: 'light', setThemeMode: () => {} }) }))

import SidebarUtilityStrip from './SidebarUtilityStrip'

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('renders the Gatekeepers link without wrapping it in a tooltip button', () => {
  const el = document.body.appendChild(document.createElement('div'))
  act(() => createRoot(el).render(<SidebarUtilityStrip />))
  const link = el.querySelector('a[aria-label="Gatekeepers"]')
  expect(link).not.toBeNull()
  expect(link!.closest('button')).toBeNull()
})
