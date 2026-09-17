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
    : tone === 'approve'
      ? '!h-6 !text-kumo-default'
      : '!h-6 !text-kumo-inactive hover:!text-kumo-danger'

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
      className="!h-6 !text-kumo-inactive"
    >
      Always approve
    </Button>
  )
}
