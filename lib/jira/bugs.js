/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config'
], function (request, Table, config) {

    var bugs = {
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
                    that.table = new Table({
                        head: ['Key', 'Type', 'Priority', 'Summary', 'Status']
                    });

                    for (i = 0; i < that.issues.length; i += 1) {
                        var issuetype = that.issues[i].fields.issuetype,
                            priority = that.issues[i].fields.priority,
                            summary = that.issues[i].fields.summary,
                            status = that.issues[i].fields.status;

                        if (!issuetype) {
                            issuetype = {
                                name: ''
                            };
                        }
                        if (!priority) {
                            priority = {
                                name: ''
                            };
                        }
                        if (summary.length > 75) {
                            summary = summary.substr(0, 72) + '...';
                        }
                        that.table.push([
                            that.issues[i].key,
                            issuetype.name,
                            priority.name,
                            summary,
                            status.name
                        ]);
                    }

                    if (that.issues.length > 0) {
                        console.log(that.table.toString());
                    } else {
                        console.log('No issues');
                    }

                });
        },

        listAllBugsByStatus: function (status) {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status="' + status + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            return this.getIssues();
        },

        listAllBugsNotReadyToTest: function () {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status+in+("Incoming", "New", "In Development")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            return this.getIssues();
        },
    };

    return bugs;

});
