import { Empty } from '@cloudflare/kumo'
import { PlugsConnected, type Icon } from '@phosphor-icons/react'
import { WorkshopButton } from './WorkshopControls'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: EmptyIcon = PlugsConnected,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: Icon
}) {
  return (
    <Empty
      size="sm"
      className="relative overflow-hidden"
      icon={
        <>
          <div
            className="themed-accent-glow pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              filter: 'blur(14px)',
            }}
          />
          <div className="themed-user-bubble-shadow relative flex h-11 w-11 items-center justify-center rounded-xl border border-kumo-line bg-kumo-elevated text-kumo-subtle">
            <EmptyIcon size={18} />
          </div>
        </>
      }
      title={title}
      description={description}
      contents={
        actionLabel && onAction ? (
          <WorkshopButton onClick={onAction}>{actionLabel}</WorkshopButton>
        ) : undefined
      }
    />
  )
}
