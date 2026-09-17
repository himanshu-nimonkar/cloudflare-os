import { Tabs } from '@cloudflare/kumo'
import { List, GridFour } from '@phosphor-icons/react'

/**
 * Shared grid/list segmented toggle. Used on Gatekeepers and Outputs so view-switching looks and
 * behaves identically across the app.
 */
export default function ViewToggle({
  view,
  onChange,
}: {
  view: 'grid' | 'list'
  onChange: (view: 'grid' | 'list') => void
}) {
  return (
    <Tabs
      variant="segmented"
      size="sm"
      value={view}
      onValueChange={(value) => onChange(value as 'grid' | 'list')}
      tabs={[
        {
          value: 'list',
          label: (
            <>
              <List size={16} weight={view === 'list' ? 'bold' : 'regular'} />
              <span className="sr-only">List view</span>
            </>
          ),
        },
        {
          value: 'grid',
          label: (
            <>
              <GridFour size={16} weight={view === 'grid' ? 'bold' : 'regular'} />
              <span className="sr-only">Grid view</span>
            </>
          ),
        },
      ]}
    />
  )
}
