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
                        head: ['Key', 'Priority', 'Status', 'Assignee', 'Prod Bug', 'Tehama Component', 'Fix Versions', 'Summary']
                    });

                    for (i = 0; i < that.issues.length; i += 1) {
                        var priority = that.issues[i].fields.priority,
                            summary = that.issues[i].fields.summary,
                            status = that.issues[i].fields.status,
                            assignee = that.issues[i].fields.assignee,
                            productionBug = that.issues[i].fields.customfield_17203,
                            tehamaComponent = that.issues[i].fields.customfield_17225,
                            fixVersions = that.issues[i].fields.fixVersions;

                        if (!priority) {
                            priority = {
                                name: ''
                            };
                        }

                        if (summary.length > 75) {
                            summary = summary.substr(0, 72) + '...';
                        }

                        if (!assignee) {
                            assignee = {
                                displayName: "Unassigned"
                            };
                        }

                        var versions = "";
                        if (fixVersions) {
                            for (j = 0; j < fixVersions.length; j += 1) {
                                versions = versions + fixVersions[j].name + " ";
                            }
                        }

                        if (!productionBug) {
                            productionBug = 'N/A'
                        } else {
                            productionBug = productionBug.value;
                        }

                        if (!tehamaComponent) {
                            tehamaComponent = 'N/A';
                        } else {
                            tehamaComponent = tehamaComponent[0].value;
                        }
                        if (tehamaComponent.length > 17) {
                            tehamaComponent = tehamaComponent.substr(0, 17);
                        }

                        that.table.push([
                            that.issues[i].key,
                            priority.name,
                            status.name,
                            assignee.displayName,
                            productionBug,
                            tehamaComponent,
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

        listAllBugsByStatus: function (status) {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status="' + status + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues();
        },

        listOneBug: function (bug) {
            this.query = 'rest/api/2/search?jql='
                + 'key="' + bug + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues();
        },
        // maxResults=100 is a bugus option the the API maxes out at 100 records
        // if there are more that 100, use the option &startAt=100
        // The code needs to be updated to handle paging
        // See https://jira.atlassian.com/browse/JRACLOUD-67570
        listAllBugsNotReadyToTest: function () {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status+in+("Incoming", "New", "In Development")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues();
        },
    };

    return bugs;

});
