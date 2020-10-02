import React, { useState } from 'react'
import { withRuntimeContext } from 'vtex.render-runtime'
import classNames from 'classnames'

import styles from './index.css'

const LocationSearchInput = ({ buttonLabel, value, redirectTo, runtime, placeholder, blockClass }) => {

  const { navigate } = runtime

  const [address, setAddress] = useState(value || "")

  const handleSubmit = e => {
    e.preventDefault()
    
    navigate({
      to: redirectTo || `/our-stores?address=${address}`,
      query: `address=${address}`
    })
  }

  return (
    <form onSubmit={handleSubmit} className={classNames([styles.locatorSearchContainer, `${styles.locatorSearchContainer}--${blockClass}`])}>
      <div className={classNames([styles.locatorInputWrapper, `${styles.locatorInputWrapper}--${blockClass}`])}>
        <input
          className={classNames([styles.locatorSearchInput, `${styles.locatorSearchInput}--${blockClass}`])}
          type="search" placeholder={placeholder || "Type your location here"}
          onChange={e => setAddress(e.target.value)}
          value={address}
        />
      </div>
      <div className={classNames([styles.locatorButtonWrapper, `${styles.locatorButtonWrapper}--${blockClass}`])}>
        <button onClick={handleSubmit} className={classNames([styles.locatorSearchButton, `${styles.locatorSearchButton}--${blockClass}`])}>{buttonLabel || "Search"}</button>
      </div>
    </form>
  )
}

export default withRuntimeContext(LocationSearchInput)
