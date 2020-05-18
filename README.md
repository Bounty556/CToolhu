# CToolhu

## Description

A Chrome Extension used by the Canvas Support team to automate miscellaneous tasks.

## Features

* Auto-clear all stuck Content Migrations
* Run a Splunk search for the page you're currently on
* Copy a Canvas Item
* Paste a Canvas Item
* Act as a random user

## Usage

* Auto-clear stuck Content Migrations
> Works only on the /content_migrations page of a course. If any migration imports are stuck (pre-processing), this will go force those to fail out.
* Splunk Search
> Begins a new Splunk search based on the current page you're on in Canvas. Will work for any page, including API pages. If you are currently masquerading as a user, the search will be configured to look for only interactions from that specific user. By default, the search will include all forms of interactions except for: Pings, Page View Loads, and Unread Count calls.
* Copy/Paste
> Adds the ability to copy entire items in Canvas, and paste them wherever you would like. For instance, if you needed to test a quiz that had specific settings and question types, you can copy that quiz, and then paste it in your course.
* Act as a random user
> Lets you act as a random user of a specific role without needing to go to any user pages. Currently supports all base-role types, include Admins, Sub Account Admins, Teachers, Students, Observers, and Course Designers. With Admins, you select which specific admin types you'd like to include in the list of random users, and works just about anywhere in a Canvas instance. All other enrollment types will require you to be in a course in order to begin acting as them.

## Copy/Paste Tool

This tool currently works with the following items:
* Assignments
* Quizzes
* Pages
* Discussions
* Announcements
* Rubrics

When copying Assignments, it's important to note that external tool assignments can not be copied. This includes Quizzes.Next assignments.

When copying Discussions, all of the discussion replies will be put in your name, and only up to the first 100 replies on a discussion will be copied/pasted. Any attachments on the discussion will not be carried over either. This is because the attachment would need to be downloaded to your system and then reuploaded into the discussion in your course, which is both not supported by the Chrome extension API, and not a good idea. The same goes for announcements.

When copying Quizzes, only the first 100 questions will be copied/pasted. Question groups are supported, as long as they do not pull from a question bank. Question groups that pull from question banks are not stored in any retrievable way in the API for a quiz, and thus can not be copied/pasted.

## Contributing

Pull requests are always welcome! If it is anything more than a minor bug fix, please open an issue first to discuss the changes you would like to make.

ALWAYS test, test, and test some more.

## Tests

Tests are currently in the works for CToolhu, but are planned to be created using the Jest package for Node.

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