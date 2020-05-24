# CToolhu

![Commit Activity](https://img.shields.io/github/commit-activity/m/Bounty556/Ctoolhu?style=flat-square)

## Description

A Chrome Extension used by the Canvas Support team to automate miscellaneous tasks.

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  * [Copy Paste Tool](#copy-paste-tool)
  * [Act As A Random User](#act-as-a-random-user)
  * [Dev Console](#dev-console)
- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## Features

* Auto-clear stuck Content Migrations
> Works only on the /content_migrations page of a course. If any imports are stuck in pre-processing, this will attempt to fail those out.
* Splunk Search
> Begins a new Splunk search based on the current page you're on in Canvas. Will work for any page, including API pages. If you are currently masquerading as a user, the search will be configured to look for only interactions from that specific user. By default, the search will include all forms of interactions except for: Pings, Page View Loads, and Unread Count calls.
* Copy/Paste
> Adds the ability to copy entire items in Canvas, and paste them wherever you would like. For instance, if you needed to test a quiz that had specific settings and question types, you can copy that quiz, and then paste it in your course.
* Act as a random user
> Lets you act as a random user of a specific role without needing to go to any user pages. Currently supports all base-role types, include Admins, Sub Account Admins, Teachers, Students, Observers, TAs, and Course Designers. With Admins, you select which specific admin types you'd like to include in the list of random users, and works just about anywhere in a Canvas instance. All other enrollment types will require you to be in a course in order to begin acting as them.

## Usage

The first thing you should do after installation is set up your Auth Token. To create a new Auth Token for CToolhu:
1. Go into Canvas, and click on Account > Settings at the top left.
2. Find the 'Approved Integrations' section, and click the '+ New Access Token' button at the bottom of the list of access tokens.
3. In the 'Purpose' box, put 'CToolhu', or whatever you want to help you remember this access token is for this tool specifically.
4. Click on 'Generate Token', and copy the token that you are given.
5. Click on the CToolhu extension to open the popup, and click 'Set Auth Token'. Paste your newly copied Auth Token in here, and click 'OK'.

Now that you have your auth token set, you can begin using the tool. Please note that because your auth token is set up only in prod, you won't be able to use any of the tools except for the Splunk Search in Beta or Test, until they refresh respectively.

### Copy Paste Tool

This tool currently works with the following items:
- Assignments
- Quizzes
- Pages
- Discussions
- Announcements
- Rubrics

Currently, the tool works only when you're on the page of the item you want to copy. For example, if you wanted to copy an assignment, go to the /courses/###/assignments/### page, and click 'Copy Item'. As of 1.2.0, this also works on the edit page for any items. You can then go to any course and paste this item in there using the 'Paste Item' button. The first time you paste an item on a site you haven't before, it will prompt you to add that site to the list of valid sites you can paste to. This is to make sure you know exactly where you're pasting to, in case you accidentally click paste in a non-sandbox instance.

When copying Assignments, it's important to note that external tool assignments can not be copied. This includes Quizzes.Next assignments.

When copying Discussions, all of the discussion replies will be put in your name. Any attachments on the discussion will not be carried over either. This is because the attachment would need to be downloaded to your system and then reuploaded into the discussion in your course, which is both not supported by the Chrome extension API, and not a good idea. The same goes for announcements.

Question groups are supported when copying Quizzes, as long as they do not pull from a question bank. Question groups that pull from question banks are not stored in any retrievable way in the API for a quiz, and thus can not be copied/pasted.

Regardless of what you're copying, POST endpoints do have data limits. If you're copying extremely large objects (>10kb), there's a good chance it won't paste. As of 1.2.0, large objects have their descriptions replaced so they can be pasted still.

### Act As A Random User

This lets you act as a random user with the selected role. For Admin roles, this will work just about anywhere in an instance, and lets you individually check whether you want to include Root Account Admins, Sub Account Admins, and Admin-based roles in the list of users it will randomly pick from.

All other roles require you to be inside of a course so it can determine which users it can pick from.

### Dev Console

Clicking on the CToolhu icon inside of the popup will open the Dev Console side panel.

Currently this only displays a brief summary of the currently copied item (if there is one), and a list of all of the sites you have validated. Both can be cleared from this Dev Console, and individual sites can be removed as needed from the validated sites list.

## Installation

CToolhu is installed just like any other extension in Chrome that isn't in the Chrome app store:
1. In the Github repo, click the green 'Clone or download' button at the top right, and choose 'Download ZIP'.
2. Go to wherever your ZIP file and extract it.
3. Move the resulting folder to a safe place, such as your Applications folder on Mac.
4. In Google Chrome, click on the 3 dots at the top right, and then 'Settings'.
5. In the Settings page, click 'Extensions' on the left.
6. In the Extensions page, make sure you have the 'Developer mode' setting set to on, in the top right corner.
7. Click 'Load unpacked' and find the CToolhu folder in your file explorer.
8. Make sure you have the CToolhu folder highlighted, and not anything inside of it, then click 'Select' or 'Open'.

CToolhu should now be installed in Google Chrome. If you don't see the extension appear at the top right, close out of Chrome and reopen.

## Contributing

Pull requests are always welcome! If it is anything more than a minor bug fix, please open an issue first to discuss the changes you would like to make.

ALWAYS test, test, and test some more.

## License

MIT License

Copyright (c) 2020 Jacob Peterson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.