import React, { useState, useEffect} from 'react'
import { Tag } from 'vtex.styleguide'
import styles from '../../index.css'
import classNames from 'classnames'
import { FormattedMessage} from 'react-intl'
import getAppSettings from './getAppSettings.gql'
import { withApollo } from 'react-apollo'
const TagFilter = ({
  tags,
  storesByTag,
  defaultTag,
  visibleTags,
  client
}) => {
  const [getSettings, setAppSettings] = useState(null)
  const [loading, setLoading] =useState(false)
  const [selectedTag, setSelectedTag] = useState(defaultTag || null)

  const getVisibleTags = async () => {
    setLoading(true)
    let vTags
    try {
      vTags = await client.query({
        query: getAppSettings,
        variables: {}
      })
      console.log("vTags", vTags);
    } catch (e) {
      console.log("error here", e);
    }
  
     vTags = vTags && vTags.data.getAppSettings
     setAppSettings(vTags)
     setSelectedTag(vTags.visibleTags)
     storesByTag(vTags.visibleTags)
    setLoading(false)
  }

  if (!tags) return null
  useEffect(() => {
    
    getVisibleTags()
  }, [])
  if (loading) return null
  return (
    <div className={classNames(styles['tag-filter-container-main'],'w-100 mx10 overflow-x-auto flex flex-column')} style={{flexWrap: 'nowrap', padding: '20px 0px', margin: '5px 0px'}}>
      {getSettings && tags.filter(t => (getSettings.visibleTags || []).indexOf(t)>-1).map(tag => (
        <div
          className={classNames(styles['tag-filter-pointer'],'pointer mt2')}
          data-tag={tag}
          onClick={e => {
            console.log(e.currentTarget.dataset.tag, selectedTag);
            if (selectedTag && e.currentTarget.dataset.tag === selectedTag) {
              setSelectedTag(null)
              storesByTag(null)
              console.log(selectedTag);
            }
            setSelectedTag(tag)
            storesByTag(tag)
          }}
        >
          <Tag type={selectedTag === tag ? 'success' : ''}>{tag}</Tag>
        </div>
      ))}
      <div className={classNames(styles['tag-filter-clear'])} >
        { tags.filter(t => (visibleTags || []).indexOf(t)>-1).length > 0 &&       
        <Tag onClick={e => { 
          e.preventDefault()
          setSelectedTag(null)
          storesByTag(null)
        }}
      >
         <FormattedMessage id="store/locator.clear" />
      </Tag>
      }
      </div>
    </div>
  );
}


export default withApollo(TagFilter)