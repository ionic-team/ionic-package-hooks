# Ionic Package Hooks

The hooks in this repository are hooks that you can run during the packaging of
your app. Ionic Package uses Cordova, so these are just standard [Cordova
Hooks](http://cordova.apache.org/docs/en/edge/guide/appdev/hooks/index.html)
that we've selected/accepted.

To run these hooks in Ionic Package, just put a `<hook />` tag in your
`config.xml`, like this:

```xml
<hook type="after_prepare" src="package-hooks/add_platform_class.js" />
```

That's it! Package will run that hook on the server.

### Re-enable HTTP for iOS9

This is probably one of the main reasons you're here, so this is how you do
that:

* Put the following in your `config.xml`:

    ```xml
    <hook type="after_prepare" src="package-hooks/ios9_allow_http.sh" />
    ```
* That's it, actually. Run `ionic package build ios ...` again and your binary
  should allow HTTP.

### Use these hooks locally

You don't need to download these hooks locally, but **local builds won't work
without them**.

To use them locally, you can clone the repository within your Ionic App, and
Cordova will pick up your `<hook />` tags within `config.xml` automatically.

**Within your app directory**:
```bash
$ git clone https://github.com/driftyco/ionic-package-hooks.git ./package-hooks
$ cd package-hooks
$ npm install
```

### Hooks

These are the available hooks. The **type** is what you put in `type` of your
`<hook />` tag, unless you want to run the hook at a different stage (not
recommended). If you want a hook to run before another one, reorder the `<hook
/>` tags.

##### `add_platform_class.js`

* **author**: Ionic
* **usage**: `<hook type="after_prepare" src="package-hooks/add_platform_class.js" />`
* **function**: Adds the various platform CSS classes to the `<body>` tag of
  your app such as `platform-android`, `platform-ios`, etc.

##### `android_ignore_translation_errors.js`

* **author**: [@carson-drake](https://github.com/carson-drake)
* **usage**: `<hook type="after_prepare" src="package-hooks/android_ignore_translation_errors.js" />`
* **function**: After Android prepare, add ` build-extras.gradle` to android platform root to
  allow android-lint to ignore the translation errors introduced when including `phonegap-plugin-barcodescanner`.

##### `ios9_allow_http.sh`

* **author**: [@daruwanov](https://github.com/daruwanov)
* **usage**: `<hook type="after_prepare" src="package-hooks/ios9_allow_http.sh" />`
* **function**: Sets `NSAllowsArbitraryLoads` to true in your `.plist` file,
  allowing all regular HTTP connections in your app again for iOS9.

##### `ios9_allow_native_fb.sh`

* **author**: [@carson-drake](https://github.com/carson-drake)
* **usage**: `<hook type="after_prepare" src="package-hooks/ios9_allow_native_fb.sh" />`
* **function**: Deletes `LSApplicationQueriesSchemes` and then reads the necessary
  listings to communicate with Facebook natively to the `.plist` file,
  allowing login and other features to occur natively rather than in safari.
* **credit**: [@mablack](https://github.com/mablack)

##### `ios_disable_bitcode.js`

* **author**: [@akofman](https://github.com/akofman)
* **usage**: `<hook type="after_prepare" src="package-hooks/ios_disable_bitcode.js" />`
* **function**: Sets `ENABLE_BITCODE` to `NO` to fix iOS builds that stopped
  working after `phonegap-plugin-push` was updated to 1.5.x.
