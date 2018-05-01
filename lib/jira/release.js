/*global requirejs,console,define,fs*/
define([
    'superagent',
    '../../lib/config'
], function (request, config) {

    var release = {
        query: null,
        table: null,

        to: function (ticket, version) {
            this.query = 'rest/api/2/issue/' + ticket;
            var versionJson = '{"update":{"fixVersions":[{"set":[{"name":"' + version + '"}]}]}}';

            request
                .put(config.auth.url + this.query)
                .send(versionJson)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }

                    return console.log('Jira ticket ' + ticket + ' assigned to release ' + version + '.');

                });
        }

    };

    return release;

});
