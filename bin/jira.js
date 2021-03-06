#!/usr/bin/env node

var requirejs = require('requirejs');
// https://docs.atlassian.com/jira/REST/server/?_ga=2.55654315.1871534859.1501779326-1034760119.1468908320#api/2/issueLink-linkIssues
requirejs.config({
    baseUrl: __dirname
});

requirejs([
    'commander',
    '../lib/config',
    '../lib/auth',
    '../lib/jira/ls',
    '../lib/jira/bugs',
    '../lib/jira/testing',
    '../lib/jira/describe',
    '../lib/jira/assign',
    '../lib/jira/release',
    '../lib/jira/comment',
    '../lib/jira/create',
    '../lib/jira/sprint',
    '../lib/jira/transitions',
    '../lib/jira/worklog',
    '../lib/jira/link',
    '../lib/jira/watch',
    '../lib/jira/versions',
    '../lib/jira/status',
], function (program, config, auth, ls, bugs, testing, describe, assign, release, comment, create, sprint, transitions, worklog, link, watch, versions, status) {

    function finalCb(err) {
        if (err) {
            console.log(err.toString());
            process.exit(1);
        }
    }

    program
        .version('v0.5.4');

    program
        .command('ls')
        .description('List my open Tehama issues')
        .option('-t, --type <name>', 'Filter by type', String)
        .option('-s, --status <name>', 'Filter by status', String)
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.status) {
                        ls.showByStatus(options.status, finalCb);
                    } else {
                        ls.showAll(options.type, finalCb);
                    }
                }
            });
        });

    program
        .command('bugs')
        .description('List All Tehama Bugs, the default is all Bugs that are not ready to test')
        .option('-s, --status <status>', 'All Tehama Bugs at Status', String)
        .option('-p, --priority <priority>', 'All Tehama Bugs at priority', String)
        .option('-b, --bug <bug>', 'One Tehama Bug by Number', String)
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.status) {
                        bugs.listAllBugsByStatus(options.status, finalCb);
                    } else if (options.priority) {
                        bugs.listAllBugsByPriority(options.priority, finalCb);
                    } else if (options.bug) {
                        bugs.listOneBug(options.bug, finalCb);
                    } else {
                        bugs.listAllBugsNotReadyToTest(finalCb);
                    }
                }
            });
        });

    program
        .command('testing')
        .description('List All Tehama issues in SUBMITTED TO TEST, READY TO TEST or TESTING COMPLETE')
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    testing.listAll();
                }
            });
        });

    program
        .command('start <issue>')
        .description('Start working on an issue.')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.start(issue);
                }
            });
        });

    program
        .command('stop <issue>')
        .description('Stop working on an issue.')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.stop(issue);
                }
            });
        });

    program
        .command('review <issue> [assignee]')
        .description('Mark issue as being reviewed [by assignee(optional)].')
        .action(function (issue, assignee) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.review(issue);
                    if (assignee) {
                        assign.to(issue, assignee);
                    }
                }
            });
        });

    program
        .command('done <issue>')
        .description('Move a Tehama issue to DONE status.')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.done(issue);
                }
            });
        });

    program
        .command('ready-for-test <issue>')
        .description('Move a Tehama issue to READY FOR TEST status.')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.readyForTest(issue);
                }
            });
        });

    program
        .command('invalid <issue>')
        .description('Mark issue as finished.')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    transitions.invalid(issue);
                }
            });
        });

    program
        .command('in-development')
        .description('List all my Tehama Jira issues with status IN DEVELOPMENT.')
        .action(function () {
            auth.setConfig(function (auth) {
                if (auth) {
                    ls.showInDevelopment(finalCb());
                }
            });
        });

    program
        .command('jql [query]')
        .description('Run JQL query')
        .option('-c, --custom <name>', 'Filter by custom jql saved in jira config', String)
        .action(function (query, options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    ls.jqlSearch(query, options);
                }
            });
        });

    program
        .command('link <from> <to>')
        .description('link issues')
        .action(function (from, to, options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    link(from, to, options, finalCb);
                }
            });
        });

    program
        .command('search <term>')
        .description('Find issues.')
        .action(function (query) {
            auth.setConfig(function (auth) {
                if (auth) {
                    ls.search(query, finalCb());
                }
            });
        });


    program
        .command('assign <issue> [user]')
        .description('Assign an issue to <user>. Provide only issue# to assign to me')
        .action(function (issue, user) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (user) {
                        assign.to(issue, user);
                    } else {
                        assign.me(issue);
                    }
                }
            });
        });

    program
        .command('versions')
        .description('List the fix version for a Tehama Bug')
        .option('-i, --issue <issue>', 'Tehama Issue Number', String)
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.issue) {
                        versions.listVersions(options.issue);
                    } else {
                        console.log('No issue specified');
                    }
                }
            });
        });

    program
        .command('status <issue>')
        .description('Get the current status for a Tehama issue')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    status.listStatus(issue);
                }
            });
        });

    program
        .command('release <issue> <version>')
        .description('Attach a Tehama issue to release <version>.')
        .action(function (issue, version) {
            auth.setConfig(function (auth) {
                if (auth) {
                    release.to(issue, version);
                }
            });
        });

    program
        .command('watch <issue> [user]')
        .description('Watch an issue to <user>. Provide only issue# to watch to me')
        .action(function (issue, user) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (user) {
                        watch.to(issue, user);
                    } else {
                        watch.me(issue);
                    }
                }
            });
        });

    program
        .command('comment <issue> [text]')
        .description('Comment an issue.')
        .action(function (issue, text) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (text) {
                        comment.to(issue, text);
                    } else {
                        comment.show(issue);
                    }
                }
            });
        });

    program
        .command('show <issue>')
        .description('Show info about a Tehama issue')
        .option('-o, --output <field>', 'Output field content', String)
        .action(function (issue, options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    if (options.output) {
                        describe.show(issue, options.output);
                    } else {
                        describe.show(issue);
                    }
                }
            });
        });

    program
        .command('open <issue>')
        .description('Open an issue in a browser')
        .action(function (issue, options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    describe.open(issue);
                }
            });
        });

    program
        .command('worklog <issue>')
        .description('Show worklog about an issue')
        .action(function (issue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    worklog.show(issue);
                }
            });
        });

    program
        .command('worklogadd <issue> <timeSpent> [comment]')
        .description('Log work for an issue')
        .option("-s, --startedAt [value]", "Set date of work (default is now)")
        .action(function (issue, timeSpent, comment, p) {
            auth.setConfig(function (auth) {
                if (auth) {
                    var o = p.startedAt || new Date().toString(), s = new Date(o);
                    worklog.add(issue, timeSpent, comment, s);
                }
            });
        }).on('--help', function () {
        console.log('  Worklog Add Help:');
        console.log();
        console.log('    <issue>: JIRA issue to log work for');
        console.log('    <timeSpent>: how much time spent (e.g. \'3h 30m\')');
        console.log('    <comment> (optional) comment');
        console.log();
    });

    program
        .command('create [project[-issue]]')
        .description('Create an issue or a sub-task')
        .action(function (projIssue) {
            auth.setConfig(function (auth) {
                if (auth) {
                    create.newIssue(projIssue);
                }
            });
        });

    program
        .command('config')
        .description('Change configuration')
        .option('-c, --clear', 'Clear stored configuration')
        .action(function (options) {
            if (options.clear) {
                auth.clearConfig();
            } else {
                auth.setConfig();
            }
        }).on('--help', function () {
        console.log('  Config Help:');
        console.log();
        console.log('    Jira URL: https://foo.atlassian.net/');
        console.log('    Username: user (for user@foo.bar)');
        console.log('    Password: Your password');
        console.log();
    });

    program
        .command('sprint')
        .description('Works with sprint boards\n' +
            'With no arguments, displays all rapid boards\n' +
            'With -r argument, attempt to find a single rapid board ' +
            'and display its active sprints\nWith both -r and -s arguments ' +
            'attempt to get a single rapidboard/ sprint and show its issues. If ' +
            'a single sprint board isnt found, show all matching sprint boards')
        .option('-r, --rapidboard <name>', 'Rapidboard to show sprints for', String)
        .option('-s, --sprint <name>', 'Sprint to show the issues', String)
        .action(function (options) {
            auth.setConfig(function (auth) {
                if (auth) {
                    sprint(options.rapidboard, options.sprint, finalCb);
                }
            });
        });

    program.parse(process.argv);

    if (program.args.length === 0) {
        auth.setConfig(function (auth) {
            if (auth) {
                program.help();
            }
        });
    }

});
