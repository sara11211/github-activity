#!/usr/bin/env node

import { program } from "commander";
import https from "https";

program
  .name("github-activity")
  .description(
    "CLI to fetch the recent activity of a GitHub user and display it."
  )
  .version("1.0.0")
  .argument("<username>", "Github username")
  .action((username) => {
    const userURL = `https://api.github.com/users/${username}/events`;

    // Necessary for Github API access
    const options = {
      headers: {
        "User-Agent": "github-activity-cli",
      },
    };

    const req = https
      .get(userURL, options, (res) => {
        // Handle invalide username error
        if (res.statusCode === 404) {
          console.log("Github user not found");
          res.resume();
          return;
        }

        // Handle fetch data error
        if (res.statusCode !== 200) {
          console.log("Failed to fetch data");
          res.resume();
          return;
        }

        let data = "";

        res.on("data", (chunk) => (data += chunk));

        res.on("end", () => {
          const events = JSON.parse(data);

          for (const event of events) {
            const type = event.type;
            const repoName = event.repo.name;

            // Handle formatted output for all types of event
            switch (type) {
              case "PushEvent":
                const commitsCount = event.payload.commits.length;
                console.log(`Pushed ${commitsCount} commits to ${repoName}`);
                break;

              case "IssuesEvent":
                const issueAction = event.payload.action;
                console.log(
                  `${
                    issueAction.charAt(0).toUpperCase() + issueAction.slice(1)
                  } an issue in ${repoName}`
                );
                break;

              case "WatchEvent":
                console.log(`Starred ${repoName}`);
                break;

              case "ForkEvent":
                console.log(`Forked ${repoName}`);
                break;

              case "PullRequestEvent":
                const pullAction = event.payload.action;
                console.log(
                  `${
                    pullAction.charAt(0).toUpperCase() + pullAction.slice(1)
                  } a pull request in ${repoName}`
                );
                break;

              default:
                console.log(`${type} on ${repoName}`);
            }
          }
        });
      })
      .on("error", (err) => {
        console.log("Request failed: ", err.message);
      })
      .end();
  });

program.parse();