Wrapped Error
-------------

This module allows you to wrap error objects inside other error objects, and to join data to an error object.

This is a simple way to improve errors while catching them, and to get the complet detail/history of an error when you intent to do something out of this error.

``` javascript
const WrappedError = require('wrappederror');

const errorTypes = {
  STRANGE_ERROR: {
    name: 'strange-error',
    message: 'a strange error occured'
  }
};

try {
  anythingThrowing();
} catch (error) {
  throw Werror.wrap(error, errorTypes.STRANGE_ERROR, {
    key: 'value'
  });
}

```
