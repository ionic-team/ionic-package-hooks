# Contributing

Pull requests are welcome!

Just be sure you have permission to submit the hook. Perhaps asking the author
to do a pull request for their work is a better idea? Otherwise, look for an
MIT license.

These are the guidelines for pull requests:

* Only `.sh` and `.js` are supported.
* Put hooks in the root of the repository.
* *Take off* the numbered prefixes, (e.g. `010_do_something.js` ->
  `do_something.js`). Those are for ordering, and ordering can be done by
  rearranging the `<hook />` tags in `config.xml`.
* Give them a concise, descriptive, and/or recognizable name.
* Add the hook alphabetically to the
  [**Hooks**](https://github.com/driftyco/ionic-package-hooks/blob/master/README.md#hooks)
  section of `README.md`, filling out **author**, **usage** (which is an
  example of the `<hook />` tag, including the appropriate, recommended hook
  `type`), and **function** (which briefly outlines what the hook does).
