/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config',
    'async'
], function (request, Table, config, async) {

    var bugs = {
        project: null,
        query: null,
        type: null,
        issuetype: null,
        issues: null,
        table: null,

        callIssueApi: function (cb) {
            var that = this,
                i = 0;
            var allIssues = [];
            var currentLength = 0;
            var currentOffset = 0;
            var currentLimit = 50;
            async.doWhilst(function (callback) {
                currentLength = 0;
                request
                    .get(config.auth.url + that.query + '&startAt=' + currentOffset + '&maxResults=' + currentLimit)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Basic ' + config.auth.token)
                    .end(function (res) {
                        if (!res.ok) {
                            return callback((res.body.errorMessages || [res.error]).join('\n'));
                        }
                        //console.log('startAt=' + currentOffset + '&maxResults=' + currentLimit);
                        allIssues.push.apply(allIssues, res.body.issues);
                        currentLength = res.body.issues.length;
                        currentOffset += currentLength;
                        return callback();
                    });
            }, function () {
                return currentLength == currentLimit;
            }, function (err) {
                return cb(null, allIssues);
            });
        },

        getIssues: function (cb) {
            var that = this,
                i = 0;
            this.callIssueApi(function (err, issues) {
                if (err) {
                    return cb(err);
                }
                that.issues = issues;
                    that.table = new Table({
                        head: ['', 'Key', 'Priority', 'Status', 'Assignee', 'Prod Bug', 'Tehama Component', 'Fix Versions', 'Summary']
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
                            i + 1,
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
                return cb(null);
            });
        },

        listAllBugsByStatus: function (status, cb) {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status="' + status + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues(cb);
        },

        listAllBugsByPriority: function (priority, cb) {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+priority="' + priority + '"'
                + '+AND+status+in+("Incoming", "New", "In Development", "Submitted to Test", "Ready For Test", "Testing Complete")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues(cb);
        },

        listOneBug: function (bug, cb) {
            this.query = 'rest/api/2/search?jql='
                + 'key="' + bug + '"'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues(cb);
        },

        listAllBugsNotReadyToTest: function (cb) {
            this.query = 'rest/api/2/search?jql='
                + 'type=Bug'
                + '+AND+status+in+("Incoming", "New", "In Development")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=100';
            return this.getIssues(cb);
        },
    };

    return bugs;

});
