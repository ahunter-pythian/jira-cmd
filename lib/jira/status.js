/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config'
], function (request, Table, config) {

    var status = {
        project: null,
        query: null,
        type: null,
        issuetype: null,
        issues: null,
        table: null,

        getIssues: function () {
            var that = this,
                i = 0;
            request
                .get(config.auth.url + this.query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    that.issues = res.body.issues;

                    for (i = 0; i < that.issues.length; i += 1) {
                        var status = that.issues[i].fields.status.name;
                        console.log(status);
                    }

                    if (that.issues.length == 0) {
                        console.log('No issue found');
                    }

                });
        },

        listStatus: function (issue) {
            this.query = 'rest/api/2/search?jql='
                + 'key="' + issue + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues();
        },
    };

    return status;

});
