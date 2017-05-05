/*
	Github plugin by Spandamn
	this is based on https://github.com/Ecuacion/Pokemon-Showdown-Node-Bot/blob/master/features/github/index.js
*/
'use strict';

let config = {};

if (!Config.github) {
	config.port = 3420;
	config.secret = "";
} else {
	config = {
		port: Config.github.port,
		secret: Config.github.secret,
	}
}

let git = exports.github = require('githubhook')(config);

let sendReport = function (html) {
	if (Config.github && Config.github.rooms) {
		Object.keys(Config.github.rooms).forEach(room => {
			let boom = Rooms(room);
			if (!boom) return;
			boom.add(html);
		});
	} else if (Rooms('development')) {
		Rooms('development').add(html);
	}
};

git.on('push', (repo, ref, result) => {
	let url = result.compare;
	let branch = /[^/]+$/.exec(ref)[0];
	let messages = [];
	let message = "";
	message += "[<font color='FF00FF'>" + Tools.escapeHTML(repo) + '</font>] ';
	message += "<font color='909090'>" + Tools.escapeHTML(result.pusher.name) + "</font> ";
	message += (result.forced ? '<font color="red">force-pushed</font>' : 'pushed') + " ";
	message += "<b>" + Tools.escapeHTML(result.commits.length) + "</b> ";
	message += "new commit" + (result.commits.length === 1 ? '' : 's') + " to ";
	message += "<font color='800080'>" + Tools.escapeHTML(branch) + "</font>: ";
	message += "<a href=\"" + Tools.escapeHTML(url) + "\">View &amp; compare</a>";
	messages.push(message);
	result.commits.forEach(function (commit) {
		let commitMessage = commit.message;
		let shortCommit = /.+/.exec(commitMessage)[0];
		if (commitMessage !== shortCommit) {
			shortCommit += '&hellip;';
		}
		message = "";
		message += "<font color='FF00FF'>" + Tools.escapeHTML(repo) + "</font>/";
		message += "<font color='800080'>" + Tools.escapeHTML(branch) + "</font> ";
		message += "<a href=\"" + Tools.escapeHTML(commit.url) + "\">";
		message += "<font color='606060'>" + Tools.escapeHTML(commit.id.substring(0, 6)) + "</font></a> ";
		message += "<font color='909090'>" + Tools.escapeHTML(commit.author.name) + "</font>: " + Tools.escapeHTML(shortCommit);
		messages.push(message);
	});
	sendReport(messages.join('<br>'));
});

git.on('pull_request', function pullRequest(repo, ref, result) {
	let COOLDOWN = 10 * 60 * 1000;
	let requestNumber = result.pull_request.number;
	let url = result.pull_request.html_url;
	let action = result.action;
	if (!updates[repo]) updates[repo] = {};
	if (action === 'synchronize') {
		action = 'updated';
	}
	if (action === 'labeled') {
		// Nobody cares about labels
		return;
	}
	let now = Date.now();
	if (updates[repo][requestNumber] && updates[repo][requestNumber] + COOLDOWN > now) {
		return;
	}
	updates[repo][requestNumber] = now;
	let message = "";
	message += "[<font color='FF00FF'>" + repo + "</font>] ";
	message += "<font color='909090'>" + result.sender.login + "</font> ";
	message += action + " pull request <a href=\"" + url + "\">#" + requestNumber + "</a>: ";
	message += result.pull_request.title;
	sendMessages(message);
});

git.listen();