import { Button } from '@cloudflare/kumo'
import { List, GridFour } from '@phosphor-icons/react'

const toggleButtonClass = (active: boolean) => (
  `!h-7 !w-7 rounded-md ${active ? '!bg-kumo-base !text-kumo-default shadow-sm' : '!text-kumo-subtle hover:!text-kumo-default'}`
)

/**
 * Shared grid/list segmented toggle. Used on Gatekeepers and Outputs so view-switching looks and
 * behaves identically across the app.
 *
 * Built from plain buttons rather than Kumo `Tabs`: this switches a display mode, not a set of tab
 * panels, so `Tabs`'s tablist/tab roles would tell screen readers the wrong interaction model.
 */
export default function ViewToggle({
  view,
  onChange,
}: {
  view: 'grid' | 'list'
  onChange: (view: 'grid' | 'list') => void
}) {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-lg border border-kumo-line bg-kumo-base p-0.5">
      <Button
        variant="ghost"
        shape="square"
        icon={<List size={16} weight={view === 'list' ? 'bold' : 'regular'} />}
        className={toggleButtonClass(view === 'list')}
        title="List view"
        aria-label="List view"
        aria-pressed={view === 'list'}
        onClick={() => onChange('list')}
      />
      <Button
        variant="ghost"
        shape="square"
        icon={<GridFour size={16} weight={view === 'grid' ? 'bold' : 'regular'} />}
        className={toggleButtonClass(view === 'grid')}
        title="Grid view"
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
      />
    </div>
  )
}
