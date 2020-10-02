import React, { useState } from 'react'
import { Marker, InfoWindow } from '@react-google-maps/api'

const StoreMarker = ({ store, map }) => {
  const [showInfo, setShow] = useState(false)
  const weekDays = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  }

  const formattedAddress = address => {
    const { street, neighborhood, number, city } = address

    return `${street}${number ? ` ${number}` : ''}, ${neighborhood}, ${city}`
  }

  return (
    <Marker
      position={{
        lat: store.address.location.latitude,
        lng: store.address.location.longitude
      }}
      style={{zIndex: 99999999999}}
      onClick={() => {
        setShow(!showInfo)
      }}
    >
      {showInfo && <InfoWindow
        position={{
          lat: store.address.location.latitude,
          lng: store.address.location.longitude
        }}
        onClose={() => setShow(false)}
      >
        <div>
          <div dangerouslySetInnerHTML={ {__html: '<h4>' + store.name + '</h4>' + store.instructions.replace(/\n/g, '<br />') } }></div>
          <p>{store.formatted_address || formattedAddress(store.address)}</p>
        </div>
      </InfoWindow>}
    </Marker>
  )
}

export default StoreMarker
