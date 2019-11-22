import Component from '@ember/component';
import { computed, action } from '@ember-decorators/object';

/**
 * Helper function to ensure 'bbls' layer is the top-most layer. MapboxGL styleIsLoaded() check,
 * and 'style.load' events do not reliably indicate a fully loaded style object.
 * To display 'bbls' as the top-most layer, must move it with moveLayer()
 */
const onMapStyleLoaded = function(e) {
  const { target: map } = e;
  const style = map.getStyle();
  if (style.sources.bbls_geojson && style.sources.carto) {
    map.moveLayer('bbls');
    map.off('data', onMapStyleLoaded);
  }
}

export default class TransportationCensusTractsMapComponent extends Component {
  /**
   * The project model
   */
  analysis = {};
  /**
   * The identifier (geoid) of the currenlty hovered feature in the map
  */
  hoveredFeatureId = null;

  /**
   * Flag for optionally displaying transit zones
   */
  showTransitZones = false;

  /**
   * Flag for optionally displaying land use
   */
  showLandUse = false;

  /**
   * Sets hoveredFeatureId to geoid of the first feature in features array argument
   */
  @action
  setFirstHoveredFeatureId(features){
    if(features && features.length && features[0]){
      this.set('hoveredFeatureId', features[0].properties.geoid);
    } else {
      this.set('hoveredFeatureId', null);
    }
  }

  /**
   * Computed property that enables feature filterer to receive array mutations in didReceiveAttrs()
   */
  // @computed('analysis.censusTractsSelection.[]')
  // get jtwStudySelectionComputed() {
  //   const selectedFeatures = this.get('analysis.censusTractsSelection') || [];
  //   return [...selectedFeatures];
  // }

  /**
   * Computed property that enables feature filterer to filter on required and normal study selection
   */
  @computed('analysis.{censusTractsSelection.[],requiredCensusTractsSelection.[]}')
  get completeCensusTractsSelection() {
    const selectedFeatures = this.get('analysis.censusTractsSelection') || [];
    const requiredFeatures = this.get('analysis.requiredCensusTractsSelection') || [];
    return [...selectedFeatures, ...requiredFeatures];
  }

  @computed('analysis.censusTractsCentroid')
  get censusTractsCentroidLngLat() {
    return this.analysis.censusTractsCentroid.features.firstObject.geometry.coordinates
  }

  /**
   * Action to pass to the MapboxGL instance created by Mapbox::Basic map in this component's template
   */
  @action
  mapLoaded(map) {
    map.on('data', onMapStyleLoaded);
  }
}