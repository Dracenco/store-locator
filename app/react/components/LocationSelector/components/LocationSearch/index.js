import React, { useRef, useState, useEffect } from 'react'
import { LoadScript, GoogleMap } from '@react-google-maps/api'
import { Spinner, Tag, Box, Button } from 'vtex.styleguide'
import { withRuntimeContext } from 'vtex.render-runtime'
import { withApollo } from 'react-apollo'
import getPickups from '../../../../../graphql/getPickups.gql'
import getAppSettings from './components/TagFilter/getAppSettings.gql'
import LocationInput from '../LocationInput'
import StoreMarker from './components/StoreMarker'
import WeekHour from './components/WeekHour'
import TagFilter from './components/TagFilter'

import styles from './index.css'

const API_KEY = "AIzaSyDXeI-lJMw2Afk-vC05mFGYVDAmayi77mM"
const libraries = ['places', 'geometry', 'visualization']
import { FormattedMessage} from 'react-intl'
function mergeArrays(...arrays) {
  let jointArray = []

  arrays.forEach(array => {
      jointArray = [...jointArray, ...array]
  })
  const uniqueArray = jointArray.reduce((newArray, item) =>{
      if (newArray.includes(item)){
          return newArray
      } else {
          return [...newArray, item]
      }
  }, [])
  return uniqueArray
}

const LocationSearch = ({client, ...props}) => {
  const { runtime, visibleTags } = props
  const { query } = runtime

  const [center, setCenter] = useState({
    lat:41.871941,
    lng:12.567380
  });
/*  const getCurrentLocation = () => {


  }
  getCurrentLocation();*/
  const [stores, setStores] = useState([])
  const [closestStores, setClosest] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [longitudeDefault, setLngDefault] = useState(null)
  const [latitudeDefault, setLatDefault] = useState(null)
  const [tagsSet, setTagsSet] = useState(false)
  const [userLocation,setUserLocation] = useState({lat: 41.871941, lng: 12.567380})
  const [userLocationUpdated,setUserLocationUpdated] = useState(true)
  const mapReference = useRef(null)
  const [filterBrand,setFilterBrand] = useState({multibrand: false, monobrand: false});

  const [getSettings, setAppSettings] = useState(null)
  const getDefaultCenter = async () => {
    setLoading(true)
    let ltDefault
    
    try {
      ltDefault = await client.query({
        query: getAppSettings,
        variables: {}
      })
    } catch (e) {
    }
    
     ltDefault = ltDefault && ltDefault.data.getAppSettings
     setAppSettings(ltDefault)
     setLatDefault(parseFloat(ltDefault.defaultLat))
     setLngDefault(parseFloat(ltDefault.defaultLng))


    setLoading(false)
  }

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log("coordinates", position.coords.longitude);

      let coordinates = {
          lng: position.coords.longitude,
          lat: position.coords.latitude
      }

      setUserLocation(coordinates);
      setUserLocationUpdated(false);
    })
  } 

  useEffect(()=>{
    userLocationUpdated && getUserLocation()
  },[userLocation])

  const calculateDistance = (store) => {
    const distance =  google.maps.geometry.spherical.computeDistanceBetween({
      lat: () => (userLocation.lat),
      lng: () => (userLocation.lng)
    }, {
      lat: () => (store.address.location.latitude),
      lng: () => (store.address.location.longitude)
    });

    return Math.round((distance / 1000) * 100) / 100;
  }
 

  const searchStoresByData = term => {
    const filteredStores = stores.filter(s => s.tagsLabel.map(tl => tl.trim().toLowerCase()).includes(getSettings.visibleTags)).filter(store => {
      return store.name.indexOf(term) > -1 || store.tagsLabel.map(tl => tl.trim().toLowerCase()).includes(term) || store.instructions.indexOf(term) > -1
    })

    return filteredStores
  }

  const handleChange = predictions => {
    const [prediction] = predictions
    const { geometry } = prediction

    const storesByData = searchStoresByData()


    const lat = geometry.location.lat()
    const lng = geometry.location.lng()
    const center = {
      lat,
      lng
    }
    const centerLit = {
      lat: () => (lat),
      lng: () => (lng)
    }

    mapReference.current.setCenter(center)
    setCenter(center)

    const bestStores = stores.filter(s => s.tagsLabel.map(tl => tl.trim().toLowerCase()).includes(getSettings.visibleTags)).filter(store => {
      return google.maps.geometry.spherical.computeDistanceBetween(centerLit, {
        lat: () => (store.address.location.latitude),
        lng: () => (store.address.location.longitude)
      }) < 6000
    })

    const allStores = mergeArrays(bestStores, storesByData)

    setClosest(bestStores)
  }

  const getStores = async () => {
    setLoading(true)

    let stores

    try {
      stores = await client.query({
        query: getPickups,
        variables: {}
      })
      console.log("stores", stores);
    } catch (e) {
      console.log("error here", e);
    }

    stores = stores && stores.data.getPickups

    if (stores && stores.length) {
      stores = stores.map(store => {
        return {
          ...store,
          distance: calculateDistance(store)
        };
      });
    }

    setStores(stores.filter(store => store.isActive === true))
    setLoading(false)
  }

  const fetchConfig = async () => {
    let ltDefault
    
    try {
      ltDefault = await client.query({
        query: getAppSettings,
        variables: {}
      })
      console.log("LTDEFAULT", ltDefault);
    } catch (e) {
      console.log("error here", e);
    }
    
     setAppSettings(ltDefault.data.getAppSettings)
  }

  useEffect(() => {

      if (!stores.length) {

        getStores()
            .finally(function () {
              fetchConfig()
            })
      }
  });
    // getDefaultCenter()

  const mapLoaded = mapInstance => {
   
    // if(longitudeDefault && latitudeDefault) {
    //   mapInstance.setCenter({lat:latitudeDefault,lng:longitudeDefault})
    // }
    mapReference.current = mapInstance
  }

  const handleStoreClick = store => {
    return mapReference.current.setCenter({
      lat: store.address.location.latitude,
      lng: store.address.location.longitude
    })
  }

  const mapContainerStyle = {
    height: "600px",
    width: "100%"
  };

  const formattedAddress = address => {
    const { street, neighborhood, number, city } = address

    return `${street}${number ? ` ${number}` : ''}, ${neighborhood}, ${city}`
  }

  const getTags = () => {
   
    let tags = []
    stores.forEach(store => {
      tags = [...tags, ...store.tagsLabel].map(t => t.trim().toLowerCase())
    })

    return [...new Set(tags)]
  }

  const storesByTag = tag => {
    if (!tag) {
      setClosest(stores)
      return null
    }
    const fStores = stores.filter(store => store.tagsLabel.map(t => t.trim().toLowerCase()).includes("multibrand".toLowerCase()))

    setClosest(fStores)
    
    return fStores
  }

  const tags = getTags()
  
  useEffect(() => {
    if (getSettings && !tagsSet && tags && tags.length) {
      console.log("set tag -> ", getSettings.visibleTags || tags[0]);
      storesByTag("multibrand".toLowerCase() || tags[0].trim().toLowerCase())
      setTagsSet(true)
    }
  }, [tags, getSettings])

  const changeMonoBrandState = () => {
    setFilterBrand({...filterBrand, monobrand: !filterBrand.monobrand});
  };

  const changeMultiBrandState = () => {
    setFilterBrand({...filterBrand, multibrand: !filterBrand.multibrand});
  };

  const buildFilter = () => {
    const multibrandImage = (filterBrand.multibrand) ?
        <img src="/arquivos/checkbox-checked.png" className={styles.checked} alt="multibrand"  width="27" height="27"/>:
        <img src="/arquivos/checkbox-empty.png" className={styles.unchecked} alt="multibrand"  width="27" height="27"/>;

    const monobrandImage = (filterBrand.monobrand) ?
        <img src="/arquivos/checkbox-checked.png" className={styles.checked} alt="multibrand"  width="27" height="27"/>:
        <img src="/arquivos/checkbox-empty.png" className={styles.unchecked} alt="multibrand"  width="27" height="27"/>;

    return (
        <div className={styles.filterMainContainerMultibrand}>
          <div className={styles.divBrand} onClick={changeMonoBrandState}>{monobrandImage}<img src="arquivos/monobrand.png" className={styles.img} alt="monobrand"  width="25" height="33"/><div className={styles.multibrandFilterMainContainer}><div className={styles.multibrandFilter}>  { 'Monomarca'}</div><div className={styles.multibrandFilterSubText}>  { 'Negozi a marchio iDO'}</div></div></div>
          <div className={styles.divBrand} onClick={changeMultiBrandState}>{multibrandImage}<img src="/arquivos/multibrand.png" className={styles.img} alt="multibrand"  width="25" height="33"/><div className={styles.multibrandFilterMainContainer}><div className={styles.multibrandFilter}>  { 'Multimarca'}</div><div className={styles.multibrandFilterSubText}>  { 'Rivenditori autorizzati'}</div></div></div>
        </div>
    )
  }
/*  let filteredStores

  if(!isLoading && !(!filterBrand.multibrand && !filterBrand.monobrand)){
    filteredStores = stores.filter(s => {
      return  filterBrand.multibrand
    })
  }*/

  return (
    <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
      <div className={`pt5 pb5 w-100 flex justify-between items-start ${styles.storeLocatorContainer}`}>
        <div className={`flex w-25 justify-start items-start ${styles.storesList}`}>
          <div className={`flex flex-column w-100 items-start justify-start ${styles.storesListContainer}`}>
            {isLoading && !mapReference.current && <Spinner />}
            {!isLoading && mapReference.current && stores && stores.length && <LocationInput style={{ width: '100%' }} type="Location" onChange={(places, value) => { handleChange(places); console.log("value", value) }} />}
            {!isLoading && mapReference.current && stores && stores.length && getSettings && tags && tags.length > 1 && <TagFilter visibleTags={visibleTags} storesByTag={storesByTag} defaultTag={getSettings.visibleTags || tags[0]} tags={tags} />}
            {(!isLoading && (stores || closestStores) && mapReference.current) && <div className='mt5 w-100' style={{ maxHeight: '70vh', overflow: 'auto' }}> {buildFilter()}
              {(closestStores && closestStores.length ? closestStores : stores.filter(s => s.tagsLabel.map(t => t.trim().toLowerCase()).includes('multibrand'))).map(store => {

                return (
                  <Box key={store.id} className={styles.storeItem}>
                    { store && store.tagsLabel.map(t => t.trim().toLowerCase()).includes('multibrand') ? <div className={styles.divBrand}><img src="/arquivos/multibrand.png" className={styles.imgBrand} alt="multibrand"  width="25" height="33"/><div className={styles.multibrand}>  { 'NEW GENERATION'}</div></div> :''}
                    { store && store.tagsLabel.map(t => t.trim().toLowerCase()).includes('monobrand') ? <div className={styles.divBrand}><img src="arquivos/monobrand.png" className={styles.imgBrand} alt="monobrand"  width="25" height="33"/><div className={styles.multibrand}>  { 'IDO'}</div></div> :''}
                   <h4 className={styles.storeItemName}>{store.name}</h4>
                    <h5 className={`gray ${styles.storeItemAddress}`}>{store.formatted_address || formattedAddress(store.address)}</h5>
                    <span>Distance: {store.distance} km</span>
                    <br />
                    { store && store.instructions && store.instructions == 'Pickup in this store' ? <p>{ <FormattedMessage id="store/locator.pickup" />}</p> : <p>{store.instructions}</p> }
                    <br />
                    <WeekHour store={store} />
                    <br />
                    <div className='w-100 vtex-locator-tags-container'>
                      {store.tagsLabel && store.tagsLabel.map(tag => (
                        <div className="ma3">
                          <Tag bgColor="#134CD8" color="#ffffff">{tag.name || tag}</Tag>
                        </div>
                      ))}
                    </div>
                    <br />
                    <Button
                      variation="primary"
                      onClick={() => handleStoreClick(store)}
                      className={styles.storeItemDetails}
                    >
                       <FormattedMessage id="store/locator.seemore" />
                    </Button>
                  </Box>
                )
              })}
            </div>}
          </div>
        </div>
        <div className={`pl5 flex w-75 justify-start items-center ${styles.storeMapContainer}`} style={{ height: '650px' }}>
          <GoogleMap
            center={center}
            mapContainerStyle={mapContainerStyle}
            zoom={8}
            style={{
              width: '100%',
              height: '100%'
            }}
            onLoad={mapLoaded}
          >
            {(getSettings && !isLoading && mapReference.current) && <div className={styles.innerMapContainer}>
              {stores.filter(s => s.tagsLabel.map(t => t.trim().toLowerCase()).includes("multibrand".toLowerCase())).map(store => {
                if (!store) return
                return (
                  <StoreMarker store={store} key={store.id} map={mapReference.current} />
                )
              })}
            </div>}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  )

}

export default withApollo(withRuntimeContext(LocationSearch))
