/*global requirejs,define,fs*/
define([
    'superagent',
    'cli-table',
    '../../lib/config',
    'async'
], function (request, Table, config, async) {

    var ls = {
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
            var currentLimit = 100;
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
                return cb(null);
            });
        },

        showAll: function (type, cb) {
            this.type = (type) ? '+AND+type="' + type + '"' : '';
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + this.type
                + '+AND+status+not+in+("Done", "Rejected")+AND+status+in+("' + this.getAvailableStatuses() + '")'
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            //console.log(this.query);
            return this.getIssues(cb);
        },

        showByStatus: function (status, cb) {
            this.status = (status) ? '+AND+status="' + status + '"' : '';
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + this.status
                + '+order+by+priority+DESC,+key+ASC&maxResults=200';
            //console.log(this.query);
            return this.getIssues(cb);
        },

        showInDevelopment: function (cb) {
            this.query = 'rest/api/2/search?jql='
                + 'assignee=currentUser()'
                + '+AND+status+in+("IN+DEVELOPMENT")'
                + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues(cb);
        },

        search: function (query, cb) {
            this.query = 'rest/api/2/search?jql='
                + 'summary+~+"' + query + '"'
                + '+OR+description+~+"' + query + '"'
                + '+OR+comment+~+"' + query + '"'
                + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues(cb);
        },

        jqlSearch: function (jql, options) {
            if (options.custom && config.custom_jql && config.custom_jql[options.custom]) {
                this.query = 'rest/api/2/search?jql=' + encodeURIComponent(config.custom_jql[options.custom]);
            } else {
                this.query = 'rest/api/2/search?jql=' + encodeURIComponent(jql);
            }
            return this.getIssues();
        },

        getAvailableStatuses: function () {
            return config.options.available_issues_statuses.join('", "');
        }
    };

    return ls;

});
