import JWT from 'jsonwebtoken';
import ENV from 'labs-ceqr/config/environment';
import cartoresponses from './fixtures/cartoresponses';
import patchXMLHTTPRequest from './helpers/mirage-mapbox-gl-monkeypatch';
import { faker } from 'ember-cli-mirage';

const secret = 'nevershareyoursecret';

export default function() {
  patchXMLHTTPRequest();
/**
   *
   * Passthroughs *
   */
  this.passthrough('/data-tables/**');
  this.passthrough('/ceqr-manual/**');
  this.passthrough('https://api.mapbox.com/**');
  this.passthrough('https://layers-api.planninglabs.nyc/**');
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
  this.get('transportation-census-estimates', function(schema, request) {
    const { queryParams } = request;

    const estimates = createTransportationCensusEstimates(5);
    if(queryParams['filter[geoid]']) {
      estimates.map((estimate) => estimate.geoid = queryParams['filter[geoid]']);
    }

    const attributes = estimates.map((estimate) => { return {attributes: estimate} });
    return { data: [ ... attributes ] };
  });

}

function createTransportationCensusEstimates(num) {
  const variables = ['population', 'trans_total', 'trans_auto_total', 'trans_public_total', 'trans_home'];
  return new Array(num).fill({}).map((_, idx) => {
    const variableIdx = idx % 5;
    return {
      geoid: `${idx.toString().padEnd(11, '0')}`,
      variable: variables[variableIdx],
      value: faker.random.number({min:10, max:1000}),
      moe: faker.random.number({min:1, max:20}),
    };
  });
}
