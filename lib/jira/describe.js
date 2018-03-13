/*global requirejs,console,define,fs*/
define([
    'superagent',
    'cli-table',
    'openurl',
    'url',
    '../../lib/config'
], function (request, Table, openurl, url, config) {

    var describe = {
        query: null,
        table: null,

        getIssueField: function (field) {
            var that = this;

            request
                .get(config.auth.url + this.query + '?fields=' + field)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }

                    if (res.body.fields) {
                        if (typeof (res.body.fields[field]) === 'string') {
                            console.log(res.body.fields[field]);
                        } else {
                            console.log(res.body.fields[field].name);
                        }
                    } else {
                        console.log('Field does not exist.');
                    }
                });
        },

        getIssue: function () {
            var that = this;

            request
                .get(config.auth.url + this.query)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log(res.body.errorMessages.join('\n'));
                    }

                    that.table = new Table();

                    var priority = res.body.fields.priority;
                    if (!priority) {
                        priority = {
                            name: ''
                        };
                    }

                    var fixVersions = res.body.fields.fixVersions;
                    var versions = "";
                    if (fixVersions) {
                        for (j = 0; j < fixVersions.length; j += 1) {
                            versions = versions + fixVersions[j].name + " ";
                        }
                    }

                    var productionBug = res.body.fields.customfield_17203;
                    if (!productionBug) {
                        productionBug = 'N/A'
                    } else {
                        productionBug = productionBug.value;
                    }

                    var tehamaComponent = res.body.fields.customfield_17225;
                    if (!tehamaComponent) {
                        tehamaComponent = 'N/A';
                    } else {
                        tehamaComponent = tehamaComponent[0].value;
                    }

                    that.table.push(
                        {'Issue': res.body.key},
                        {'Summary': res.body.fields.summary},
                        {'Type': res.body.fields.issuetype.name},
                        {'Priority': priority.name},
                        {'Status': res.body.fields.status.name},
                        {'Fix Version/s': versions},
                        {
                            'Reporter': res.body.fields.reporter.displayName
                            + ' <' + res.body.fields.reporter.emailAddress + '> '
                        },
                        {
                            'Assignee':
                            (res.body.fields.assignee ? res.body.fields.assignee.displayName : "Unassigned")
                            + ' <' + (res.body.fields.assignee ? res.body.fields.assignee.emailAddress : "") + '> '
                        },
                        { 'Production Bug': productionBug },
                        { 'Tehama Component': tehamaComponent }
                    );

                    console.log(that.table.toString());
                });
        },

        open: function (issue) {
            openurl.open(url.resolve(config.auth.url, 'browse/' + issue));
        },

        show: function (issue, field) {
            this.query = 'rest/api/latest/issue/' + issue;
            if (field) {
                return this.getIssueField(field);
            } else {
                return this.getIssue();
            }
        }
    };

    return describe;

});
