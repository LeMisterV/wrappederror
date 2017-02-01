module.exports = WrappedError;

const stype = Symbol('type');
const sdata = Symbol('data');

function WrappedError (errortype, data) {
  if (errortype && (!errortype.name || !errortype.message)) {
    throw new WrappedError(WrappedError.INVALID_TYPE_DEFINITION, {
      giventype: errortype
    });
  }

  Error.captureStackTrace(this, WrappedError);

  this[stype] = errortype || WrappedError.UNDEFINED_ERROR;
  this[sdata] = data || {};
}

WrappedError.prototype = assign(
  Object.create(Error.prototype),
  {
    get constructor () {
      return WrappedError;
    },

    get type () {
      return this[stype];
    },

    get data () {
      return this[sdata];
    },

    get name () {
      return this[stype].name;
    },

    get message () {
      return this[stype].message;
    },

    getErrors (map) {
      return getErrorsRecurcif(this, map);
    },

    is (type) {
      return this[stype] === type;
    }
  }
);

assign(WrappedError,
  {
    UNDEFINED_ERROR: {
      name: 'UndefinedError',
      message: 'Undefined error'
    },

    INVALID_TYPE_DEFINITION: {
      name: 'Invalid error type definition',
      message: 'Error type definition should be an object defined with at least a name and a message'
    },

    match (error, errortype, data) {
      return (error instanceof WrappedError) &&
        (!errortype || error.type === errortype) &&
        !Object.keys(data).some(valueConflict.bind(null, data, error.data));
    },

    wrapMulti (errors, errortype, data) {
      let error = new WrappedError(errortype, data);
      error.data.originalErrors = errors;

      return error;
    },

    wrap (originalError, errortype, data) {
      data = data || {};

      if (WrappedError.match(originalError, errortype, data)) {
        Object.assign(originalError.data, data);
        return originalError;
      }

      let error = new WrappedError(errortype, data);
      error.data.originalError = originalError;

      return error;
    }
  }
);

function assign (to) {
  [].slice.call(arguments).slice(1).forEach((from) => {
    Object.keys(from).forEach((property) => {
      let descriptor = Object.getOwnPropertyDescriptor(from, property);

      if (descriptor && (!descriptor.writable || !descriptor.configurable || !descriptor.enumerable || descriptor.get || descriptor.set)) {
        Object.defineProperty(to, property, descriptor);
      } else {
        to[property] = from[property];
      }
    });
  });

  return to;
}

function getErrorsRecurcif (error, map) {
  if (map) {
    error = map(error);
  }

  if (!error) {
    return [];
  }

  let errors = [error];

  if (!error.data) {
    return errors;
  }

  if (error.data.originalError) {
    let flatened = getErrorsRecurcif(error.data.originalError, map);
    errors = flatened.concat(errors);
  } else if (error.data.originalErrors) {
    // Here we reverse errors array to get final errors array in the right order
    error.data.originalErrors.reverse().forEach((error) => {
      let flatened = getErrorsRecurcif(error, map);
      errors = flatened.concat(errors);
    });
  }

  return errors;
}

// returns true if ref object differs from "this" on given key
// no conflict if the key is not defined on ref object
function valueConflict (obj1, obj2, key) {
  return (key in obj1) && (key in obj2) && (obj1[key] !== obj2[key]);
}
