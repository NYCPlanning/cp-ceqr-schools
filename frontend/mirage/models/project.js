import { Model, belongsTo } from 'ember-cli-mirage';

export default Model.extend({
  publicSchoolsAnalysis: belongsTo(),
  transportationAnalysis: belongsTo(),
  communityFacilitiesAnalysis: belongsTo(),
  dataPackage: belongsTo(),
});
