import { Badge } from '@cloudflare/kumo'

/**
 * "Reconnecting…" pill for a fixed-height chrome strip (the workspace editor's top bar, the app
 * shell's top bar). Deliberately an inline chip rather than a full-width banner: a banner inserted
 * above the page reflows everything below it, so a blip that recovers on its own visibly jolts the
 * layout twice.
 */
export default function ReconnectingChip() {
  return (
    // Badge doesn't forward arbitrary props (e.g. role), so the a11y status role wraps it.
    <span role="status">
      <Badge variant="warning" className="border border-kumo-warning/20">
        Reconnecting…
      </Badge>
    </span>
  )
}
