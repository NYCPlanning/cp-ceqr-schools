import JWT from 'jsonwebtoken';
import ENV from 'labs-ceqr/config/environment';
import cartoresponses from './fixtures/cartoresponses';
import patchXMLHTTPRequest from './helpers/mirage-mapbox-gl-monkeypatch';
import getTransportationCensusEstimateResponse from  './helpers/get-transportation-census-estimate-response';
const secret = 'nevershareyoursecret';

export default function() {
  patchXMLHTTPRequest();
  /**
   *
   * Passthroughs
   *
   */
  this.passthrough('/data-tables/**');
  this.passthrough('/ceqr-manual/**');
  this.passthrough('https://api.mapbox.com/**');
  this.passthrough('https://layers-api.planninglabs.nyc/**');
  this.passthrough('https://layers-api-staging.planninglabs.nyc/**');
  this.passthrough('https://tiles.planninglabs.nyc/**');
  this.passthrough('https://events.mapbox.com/events/**');
  this.passthrough('https://planninglabs.carto.com/api/v1/map');
  this.passthrough('https://cartocdn-gusc-a.global.ssl.fastly.net/planninglabs/**');
  this.passthrough('https://cartocdn-gusc-b.global.ssl.fastly.net/planninglabs/**');
  this.passthrough('https://cartocdn-gusc-c.global.ssl.fastly.net/planninglabs/**');
  this.passthrough('https://cartocdn-gusc-d.global.ssl.fastly.net/planninglabs/**');
  this.passthrough('https://js-agent.newrelic.com/**');

  /**
   *
   * Carto Data
   *
   */
  this.get(`https://${ENV.carto['domain']}/**`, function(schema, request) {
    const { response: { content: { text } } } = cartoresponses.log.entries.find((entry) => {
      // decode encoded uri so it's less noisy. trim it, then extract the columns
      const recordedResponseUrl = decodeURI(entry.request.url).trim().match(/select[\s\S]*?from/i)[0];
      // replace new lines and breaks, trim, and extract columns
      const fakeRequestUrl = request.url.replace(/(\r\n|\n|\r)/gm, "").trim().match(/select[\s\S]*?from/i)[0];

      return recordedResponseUrl === fakeRequestUrl;
    });

    return JSON.parse(text);
  });

  this.urlPrefix = `${ENV.host}`;
  /**
   *
   * Users/Auth
   *
   */
  this.post('/auth/v1/login', function() {
    const token = JWT.sign({ user_id: 1, email: 'me@me.com' }, secret);

    return {
      token,
    };
  });

  // everything after this is scoped to this namespace
  this.namespace = '/api/v1';
  this.get('/users/:id');

  /**
   *
   * Projects
   *
  }
   */
  this.get('/projects');
  this.get('/projects/:id');
  this.post('/projects', function(schema) {
    const attrs = this.normalizedRequestAttrs();

    attrs.borough = 'Manhattan';

    const project = schema.projects.create(attrs);
    project.createPublicSchoolsAnalysis({ project });
    project.save();

    return project; }); this.patch('/projects');
  this.patch('/projects/:id');

  /**
   *
   * Analyses
   *
   */
  this.patch('public-schools-analyses/:id');
  this.patch('transportation-analyses/:id');
  /**
   *
   * BBLs
   *
   */
  this.get('bbls');

  /**
   *
   * Transportation census estimates
   *
   */
  this.get('acs-estimates', function(schema, request) {
    const { queryParams } = request;

    const response = getTransportationCensusEstimateResponse('ACS');
    if(queryParams['filter[geoid]']) {
      response.data.map((estimate) => estimate.geoid = queryParams['filter[geoid]']);
    }

    return response;
  });

  this.get('ctpp-estimates', function(schema, request) {
    const { queryParams } = request;

    const response = getTransportationCensusEstimateResponse('CTPP');
    if(queryParams['filter[geoid]']) {
      response.data.map((estimate) => estimate.geoid = queryParams['filter[geoid]']);
    }

    return response;
  });
}


