// "Start with a format": one click per standard output the deployment offers. Renders nothing when
// it promotes none, which is the default.

import { Button } from '@cloudflare/kumo'
import { FormatGlyph } from './FormatVisuals'
import { useOutputFormats } from './useOutputFormats'

export default function NewFormatRow({ label = 'Start with' }: { label?: string }) {
  const { formats, creating, create } = useOutputFormats()

  if (formats.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-kumo-inactive">
        {label}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {formats.map((format) => (
          <Button
            key={format.blueprintId}
            variant="secondary"
            disabled={creating !== null}
            onClick={() => create(format)}
            title={format.description || undefined}
            icon={
              <FormatGlyph
                output={format.output}
                size="md"
                className={creating === format.blueprintId ? 'animate-pulse' : 'text-kumo-subtle'}
              />
            }
            className="!rounded-full !px-3.5 !py-2 disabled:cursor-default"
          >
            {creating === format.blueprintId ? `Creating…` : `New ${format.output.noun}`}
          </Button>
        ))}
      </div>
    </div>
  )
}
