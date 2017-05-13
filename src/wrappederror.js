module.exports = WrappedError;

const stype = Symbol('type');
const sdata = Symbol('data');

function WrappedError (errortype = WrappedError.UNDEFINED_ERROR, data = {}) {
  if (!errortype.name || !errortype.message) {
    throw new WrappedError(WrappedError.INVALID_TYPE_DEFINITION, {
      giventype: errortype
    });
  }

  this[stype] = errortype;
  this[sdata] = data;

  // We have to set stype property (for name getter) before capturing stack
  Error.captureStackTrace(this, WrappedError);
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

    get mergedData () {
      const dataList = this.getErrors((error) => error[sdata]);

      const merge = Object.assign({}, ...dataList);

      if (this[sdata].originalError) {
        delete merge.originalErrors;
      } else if (this[sdata].originalErrors) {
        delete merge.originalError;
      }

      return merge;
    },

    get name () {
      return this[stype] && this[stype].name;
    },

    get message () {
      return this[stype] && this[stype].message;
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

    match (error, errortype, data = {}) {
      return (error instanceof WrappedError) &&
        (!errortype || error[stype] === errortype) &&
        !Object.keys(data).some(valueConflict.bind(null, data, error[sdata]));
    },

    wrapMulti (errors, errortype, data) {
      const error = new WrappedError(errortype, data);
      error[sdata].originalErrors = errors;

      return error;
    },

    wrap (originalError, errortype, data) {
      if (WrappedError.match(originalError, errortype, data)) {
        Object.assign(originalError[sdata], data);
        return originalError;
      }

      const error = new WrappedError(errortype, data);
      error[sdata].originalError = originalError;

      return error;
    }
  }
);

function assign (to, ...objects) {
  objects.forEach((from) => {
    Object.keys(from).forEach((property) => {
      const descriptor = Object.getOwnPropertyDescriptor(from, property);

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
  const errorValue = map ? map(error) : error;

  if (!errorValue) {
    return [];
  }

  const hasNoParent = !error[sdata] ||
    !(error[sdata].originalError || error[sdata].originalErrors);

  if (hasNoParent) {
    return [errorValue];
  }

  if (error[sdata].originalError) {
    let flatened = getErrorsRecurcif(error[sdata].originalError, map);
    flatened.push(errorValue);
    return flatened;
  }

  let errors = [];

  error[sdata].originalErrors.forEach((error) => {
    const flatened = getErrorsRecurcif(error, map);
    errors = errors.concat(flatened);
  });

  errors.push(errorValue);

  return errors;
}

// returns true if ref object differs from "this" on given key
// no conflict if the key is not defined on ref object
function valueConflict (obj1, obj2, key) {
  return (key in obj1) && (key in obj2) && (obj1[key] !== obj2[key]);
}
