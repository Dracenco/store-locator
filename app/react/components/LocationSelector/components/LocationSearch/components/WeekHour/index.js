import React, { useState } from 'react'

import { Collapsible } from 'vtex.styleguide'
import { FormattedMessage} from 'react-intl'
const weekDays = {
    0:  <FormattedMessage id="store/locator.sunday" />,
    1:  <FormattedMessage id="store/locator.monday" />,
    2:  <FormattedMessage id="store/locator.tuesday" />,
    3:  <FormattedMessage id="store/locator.wednesday" />,
    4:  <FormattedMessage id="store/locator.thursday" />,
    5:  <FormattedMessage id="store/locator.friday" />,
    6:  <FormattedMessage id="store/locator.saturday" />
}

const WeekHour = ({ store }) => {

    const [isOpen, setOpen] = useState(false)

    return (
        <Collapsible
            header={
                <span className="gray fw5">
                    <FormattedMessage id="store/locator.workinghours" />
                </span>
            }
            onClick={() => setOpen(!isOpen)}
            isOpen={isOpen}
        >
            <div className='mt4'>
            {store.businessHours.map(hour => (
                <div key={hour.dayOfWeek} className='bold'>
                {weekDays[hour.dayOfWeek]}<br />
                {hour.openingTime} - {hour.closingTime}
                </div>
            ))}
            </div>
        </Collapsible>
    )
}

export default WeekHour