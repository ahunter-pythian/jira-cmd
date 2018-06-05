/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config'
], function (request, Table, config) {

    var testing = {
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
                        head: ['', 'Key', 'Type', 'Status', 'Priority', 'Versions', 'Summary']
                    });

                    for (i = 0; i < that.issues.length; i += 1) {
                        var issuetype = that.issues[i].fields.issuetype;
                        if (!issuetype) {
                            issuetype = {
                                name: ''
                            };
                        }

                        var priority = that.issues[i].fields.priority;
                        if (!priority) {
                            priority = {
                                name: ''
                            };
                        }

                        var status = that.issues[i].fields.status;
                        if (!status) {
                            status = {
                                name: ''
                            };
                        }

                        var fixVersions = that.issues[i].fields.fixVersions;
                        var versions = "";
                        if (fixVersions) {
                            for (j = 0; j < fixVersions.length; j += 1) {
                                versions = versions + fixVersions[j].name + " ";
                            }
                        }

                        var summary = that.issues[i].fields.summary;
                        if (summary.length > 75) {
                            summary = summary.substr(0, 72) + '...';
                        }

                        that.table.push([
                            i + 1,
                            that.issues[i].key,
                            issuetype.name,
                            status.name,
                            priority.name,
                            versions,
                            summary
                        ]);
                    }

                    if (that.issues.length > 0) {
                        console.log(that.table.toString());
                    } else {
                        console.log('No issues');
                    }

                });
        },

        listAll: function () {
            this.query = 'rest/api/2/search?jql='
                + '+status+in+("Submitted to Test", "Ready for Test", "Testing Complete")'
                + '+AND+project=TEHAMA'
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            return this.getIssues();
        },

    };

    return testing;

});
