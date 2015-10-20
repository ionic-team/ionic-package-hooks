# ionic-package-hooks
The hooks in this repository are hooks that you can run during the packaging of
your app. Ionic Package uses Cordova, so these are just standard [Cordova
Hooks](http://cordova.apache.org/docs/en/edge/guide/appdev/hooks/index.html)
that we've selected/accepted.

To run these hooks during your builds in Ionic Package, just put them in your
`config.xml` as [documented in the Cordova
docs](http://cordova.apache.org/docs/en/edge/guide/appdev/hooks/index.html),
making sure to match `src` with the filename of the hook in this repo prepended
by `package-hooks/`.

For example, to run the `add_platform_class.js` hook, just put in this bit of
code in your `config.xml`:

```xml
<hook type="after_prepare" src="package-hooks/add_platform_class.js" />
```

## Local

You don't need to download these hooks locally, but if you want to use them for
local builds, you can clone the repository within your Ionic App, and Cordova
should pick up your `<hook />` tags within `config.xml` automatically.

**Within your app directory**:
```bash
$ git clone https://github.com/driftyco/ionic-package-hooks.git ./package-hooks
```
