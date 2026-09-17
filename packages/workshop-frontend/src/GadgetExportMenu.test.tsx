// @vitest-environment jsdom
/* eslint-disable react/react-in-jsx-scope */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RpcStub } from 'capnweb'
import type { GadgetClient } from '@gadgets/workshop-shared/api'
import type { GadgetExportFormat } from '@gadgets/workshop-shared/api'

const testGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
const previousActEnvironment = testGlobal.IS_REACT_ACT_ENVIRONMENT
testGlobal.IS_REACT_ACT_ENVIRONMENT = true
afterAll(() => {
  if (previousActEnvironment === undefined) delete testGlobal.IS_REACT_ACT_ENVIRONMENT
  else testGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
})

// Kumo's DropdownMenu (Base UI Menu) measures its trigger/content and tracks pointer capture for
// touch drag-to-select; jsdom implements none of that.
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
// jsdom has no PointerEvent constructor at all.
if (typeof PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    isPrimary: boolean
    constructor(type: string, params: MouseEventInit & { pointerId?: number; isPrimary?: boolean } = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.isPrimary = params.isPrimary ?? true
    }
  }
  vi.stubGlobal('PointerEvent', PointerEventPolyfill)
}

const mocks = vi.hoisted(() => ({
  saveStreamToFile: vi.fn<(
    createStream: () => Promise<ReadableStream<Uint8Array>>,
    filename: string,
    fileType: {description: string; contentType: string; extension: string},
  ) => Promise<void>>(),
  toast: vi.fn<(toast: unknown) => void>(),
}))

vi.mock('@cloudflare/kumo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cloudflare/kumo')>()
  return {
    ...actual,
    useKumoToastManager: () => ({ add: mocks.toast }),
  }
})

// Real browser download / stream-to-disk I/O; there is no jsdom equivalent to exercise, so this
// boundary stays mocked.
vi.mock('./fileTransfers', () => ({
  makeExportFilename: (title: string, extension: string) => `${title}${extension}`,
  saveStreamToFile: mocks.saveStreamToFile,
}))

import GadgetExportMenu from './GadgetExportMenu'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  mocks.saveStreamToFile.mockReset()
  mocks.toast.mockReset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

function gadget(overrides: Partial<GadgetClient>): RpcStub<GadgetClient> {
  return overrides as RpcStub<GadgetClient>
}

// The real DropdownMenu portals its content to document.body, outside `container`, so lookups
// search the whole document rather than being scoped to the render root. Its items render as
// `[role="menuitem"]` elements (not <button>s), alongside real <button>s elsewhere in the tree.
function button(label: string): HTMLElement | undefined {
  return Array.from(document.body.querySelectorAll<HTMLElement>('button, [role="menuitem"]'))
    .find(candidate => candidate.textContent === label)
}

function trigger(): HTMLButtonElement {
  const found = document.body.querySelector<HTMLButtonElement>('[aria-label="Export Gadget"]')
  if (!found) throw new Error('Export Gadget trigger not found')
  return found
}

// A plain `.click()` only dispatches a `click` event; Base UI's Menu trigger also needs the
// pointerdown/mousedown pair that precedes it to correctly toggle open/closed.
function realClick(element: Element) {
  const pointerOpts = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true }
  element.dispatchEvent(new PointerEvent('pointerdown', pointerOpts))
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  element.dispatchEvent(new PointerEvent('pointerup', pointerOpts))
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

async function open() {
  await act(async () => { realClick(trigger()) })
}

async function close() {
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
}

// Kumo's Tooltip opens on real hover after its default 600ms delay and portals its content, so
// reading the current label means hovering, waiting the delay out, and reading the popup.
async function tooltipText(): Promise<string | null> {
  const el = trigger()
  await act(async () => {
    el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
  })
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 700)) })
  const text = document.body.querySelector('.kumo-tooltip-popup')?.textContent ?? null
  await act(async () => {
    el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
  })
  return text
}

describe('GadgetExportMenu', () => {
  it('loads formats on open and exports the selected one with its metadata', async () => {
    const exportFormat = vi.fn<(
      id: string,
      chatId?: number,
    ) => Promise<ReadableStream<Uint8Array>>>(
      async () => new ReadableStream<Uint8Array>(),
    )
    const formats: GadgetExportFormat[] = [{
      id: 'csv',
      label: 'CSV',
      mode: 'server',
      contentType: 'text/csv',
      fileExtension: '.csv',
    }]
    const client = gadget({
      getExportFormats: vi.fn<(chatId?: number) => Promise<GadgetExportFormat[]>>(
        async () => formats,
      ),
      export: exportFormat,
    })
    mocks.saveStreamToFile.mockImplementation(async (createStream) => {
      await createStream()
    })

    await act(async () => {
      root.render(<GadgetExportMenu gadget={client} gadgetTitle="Report" chatId={7} />)
    })
    expect(client.getExportFormats).not.toHaveBeenCalled()

    await open()
    await act(async () => { realClick(button('CSV')!) })

    expect(client.getExportFormats).toHaveBeenCalledWith(7)
    expect(exportFormat).toHaveBeenCalledWith('csv', 7)
    expect(mocks.saveStreamToFile).toHaveBeenCalledWith(
      expect.any(Function),
      'Report.csv',
      { description: 'CSV', contentType: 'text/csv', extension: '.csv' },
    )
  })

  it('disables the export button and updates its tooltip while exporting', async () => {
    let finishExport!: () => void
    const pendingExport = new Promise<void>(resolve => { finishExport = resolve })
    const format: GadgetExportFormat = {
      id: 'csv',
      label: 'CSV',
      mode: 'server',
      contentType: 'text/csv',
      fileExtension: '.csv',
    }
    const client = gadget({
      getExportFormats: vi.fn<(chatId?: number) => Promise<GadgetExportFormat[]>>(
        async () => [format],
      ),
    })
    mocks.saveStreamToFile.mockReturnValue(pendingExport)

    await act(async () => {
      root.render(<GadgetExportMenu gadget={client} gadgetTitle="Report" />)
    })
    await open()
    await act(async () => { realClick(button('CSV')!) })

    expect(trigger().disabled).toBe(true)
    expect(await tooltipText()).toBe('Exporting to CSV')

    await act(async () => {
      finishExport()
      await pendingExport
    })

    expect(trigger().disabled).toBe(false)
    expect(await tooltipText()).toBe('Export Gadget')
  })

  it('shows an empty state without hiding or disabling the export button', async () => {
    const client = gadget({
      getExportFormats: vi.fn<(chatId?: number) => Promise<GadgetExportFormat[]>>(
        async () => [],
      ),
    })

    await act(async () => {
      root.render(<GadgetExportMenu gadget={client} gadgetTitle="Report" />)
    })
    expect(document.body.querySelector('[aria-label="Export Gadget"]')).not.toBeNull()
    expect(trigger().disabled).toBe(false)

    await open()

    expect(document.body.textContent).toContain('This Gadget does not support exports.')
    expect(document.body.querySelector('[aria-label="Export Gadget"]')).not.toBeNull()
  })

  it('does not render the control without a selected Gadget', async () => {
    await act(async () => {
      root.render(<GadgetExportMenu gadget={null} gadgetTitle="Gadget" />)
    })

    expect(container.querySelector('[aria-label="Export Gadget"]')).toBeNull()
  })

  it('loads fresh formats on every open and ignores a response after close', async () => {
    let resolveFirst!: (formats: GadgetExportFormat[]) => void
    const first = new Promise<GadgetExportFormat[]>(resolve => { resolveFirst = resolve })
    const second: GadgetExportFormat[] = [{
      id: 'csv:second', label: 'Second sheet', mode: 'server',
      contentType: 'text/csv', fileExtension: '.csv',
    }]
    const getExportFormats = vi.fn<(chatId?: number) => Promise<GadgetExportFormat[]>>()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(second)
    const client = gadget({ getExportFormats })

    await act(async () => {
      root.render(<GadgetExportMenu gadget={client} gadgetTitle="Report" />)
    })
    await open()

    expect(document.body.querySelector('[role="status"][aria-label="Loading export formats"]')).not.toBeNull()
    await close()
    expect(document.body.querySelector('[role="status"][aria-label="Loading export formats"]')).toBeNull()

    await open()
    expect(document.body.textContent).toContain('Second sheet')

    await act(async () => {
      resolveFirst([{
        id: 'csv:first', label: 'First sheet', mode: 'server',
        contentType: 'text/csv', fileExtension: '.csv',
      }])
      await first
    })

    expect(document.body.textContent).not.toContain('First sheet')
    expect(document.body.textContent).toContain('Second sheet')
    expect(getExportFormats).toHaveBeenCalledTimes(2)
  })

  it('shows an inline error and retries format discovery', async () => {
    const format: GadgetExportFormat = {
      id: 'html', label: 'HTML', mode: 'browser',
      contentType: 'text/html', fileExtension: '.html',
    }
    const getExportFormats = vi.fn<(chatId?: number) => Promise<GadgetExportFormat[]>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce([format])
    const client = gadget({ getExportFormats })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      await act(async () => {
        root.render(<GadgetExportMenu gadget={client} gadgetTitle="Report" />)
      })
      await open()

      expect(document.body.textContent).toContain('Export formats could not be loaded.')
      expect(button('Try again')).toBeDefined()

      await act(async () => { realClick(button('Try again')!) })

      expect(button('HTML')).toBeDefined()
      expect(getExportFormats).toHaveBeenCalledTimes(2)
      expect(mocks.toast).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })
})
