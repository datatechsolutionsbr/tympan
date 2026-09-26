import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { RecordActions, RecordCard } from './RecordCard'

describe('RecordCard in right-to-left locales', () => {
  it('renders in a right-to-left list and passes axe', async () => {
    const { container } = inRtl(
      <ul>
        <RecordCard title="مدقق" secondary="يوقّع الإصدارات" state onOpen={() => {}} footer={<RecordActions recordTitle="مدقق" editLabel="تعديل" deleteLabel="حذف" onEdit={() => {}} onDelete={() => {}} confirmDeleteTitle="حذف؟" />} />
      </ul>,
    )
    expect(container.querySelector('li')).toBeTruthy()
    await expectNoAxeViolations(container)
  })
})
