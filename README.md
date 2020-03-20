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
> Adds the ability to copy entire items in Canvas, and paste them wherever you would like. For instance, if you needed to test a quiz that had specific settings and question types, you can copy that quiz, and then paste it in your course. Currently, Assignments, Quizzes, Discussions, Pages, Announcements, and Rubrics are supported.
* Act as a random user
> WIP...


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