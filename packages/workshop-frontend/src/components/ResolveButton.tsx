import { Button } from '@cloudflare/kumo'
import type { MouseEventHandler } from 'react'

export function ResolveButton({
  tone,
  variant = 'quiet',
  disabled,
  onClick,
}: {
  tone: 'approve' | 'deny'
  variant?: 'quiet' | 'filled'
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}) {
  const toneClassName = variant === 'filled'
    ? '!h-7'
    // Kumo's ghost variant has no disabled guard on its own hover:bg-kumo-tint, so a disabled
    // button still shows hover feedback unless it's explicitly suppressed here too.
    : tone === 'approve'
      ? '!h-6 !text-kumo-default disabled:hover:!bg-inherit'
      : '!h-6 !text-kumo-inactive enabled:hover:!text-kumo-danger disabled:hover:!bg-inherit'

  return (
    <Button
      variant={variant === 'filled' ? 'primary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={toneClassName}
    >
      {tone === 'approve' ? 'Approve' : 'Deny'}
    </Button>
  )
}

export function AlwaysApproveButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="!h-6 !text-kumo-inactive disabled:hover:!bg-inherit"
    >
      Always approve
    </Button>
  )
}
