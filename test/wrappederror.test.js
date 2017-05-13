/* global describe it */

const expect = require('chai').expect;

const WrappedError = require('../src/wrappederror');

module.exports = describe('WrappedError', () => {
  it('Should give an instance of Error', () => {
    let error = new WrappedError();

    expect(error instanceof Error).to.be.true;
  });

  it('Should be able to check error type definition', () => {
    let error = new WrappedError();

    expect(error.constructor).to.equal(WrappedError);

    expect(error.type).to.deep.equal({
      name: 'UndefinedError',
      message: 'Undefined error'
    });
    expect(error.name).to.equal('UndefinedError');
    expect(error.message).to.equal('Undefined error');

    expect(error.is(WrappedError.UNDEFINED_ERROR)).to.be.true;
  });

  it('Should be able to give it\'s own type definition', () => {
    let errorType = {
      name: 'CustomError',
      message: 'A custom error was thrown'
    };
    let error = new WrappedError(errorType);

    expect(error.constructor).to.equal(WrappedError);

    expect(error.type).to.deep.equal({
      name: 'CustomError',
      message: 'A custom error was thrown'
    });
    expect(error.name).to.equal('CustomError');
    expect(error.message).to.equal('A custom error was thrown');

    expect(error.is(errorType)).to.be.true;
  });

  it('Should allow to complet an error\'s data content', () => {
    let error = new WrappedError();
    WrappedError.wrap(error, null, {
      key1: 'value'
    });

    expect(error.data).to.deep.equal({
      key1: 'value'
    });
  });

  it('Should allow to wrap an error', () => {
    let errorNative = new Error('any error');
    let error = WrappedError.wrap(errorNative);

    expect(error instanceof Error).to.be.true;
    expect(error.data.originalError).to.equal(errorNative);
  });

  it('Should be able to wrap multiple errors in one', () => {
    let error1 = new Error('error 1');
    let error2 = new Error('error 2');
    let errorType = {
      name: 'ErrorsReport',
      message: 'More than one error occured'
    };
    let error = WrappedError.wrapMulti([error1, error2], errorType);

    expect(error.is(errorType)).to.be.true;
    expect(error.data.originalErrors).to.deep.equal([error1, error2]);
  });

  it('Should throw when trying to use invalid error type', () => {
    expect(() => {
      return new WrappedError({});
    }).to.throw();
  });

  it('Should handle wrapping errors with same type and data conflict', () => {
    const type = {
      name: 'errortype',
      message: 'error type'
    };

    const error1 = new WrappedError(type, { key: 'value1' });
    const error2 = WrappedError.wrap(error1, type, { key: 'value2' });

    expect(error2.data).to.deep.equal({
      key: 'value2',
      originalError: error1
    });
    expect(error1.data).to.deep.equal({
      key: 'value1'
    });
  });

  describe('getErrors', () => {
    it('Should return flattened errors list', () => {
      let types = {
        ERROR1: {
          name: 'erreur1',
          message: 'Erreur 1'
        },
        ERROR2: {
          name: 'erreur2',
          message: 'Erreur 2'
        },
        ERROR3: {
          name: 'erreur3',
          message: 'Erreur 3'
        }
      };

      let error1 = new WrappedError(types.ERROR1);

      let error2 = WrappedError.wrap(error1, types.ERROR2);
      let error3 = WrappedError.wrap(error2, types.ERROR3);

      expect(error3.getErrors()).to.deep.equal([
        error1,
        error2,
        error3
      ]);
    });

    it('Should return flattened errors list even with multiwrapped error', () => {
      let types = {
        ERROR1: {
          name: 'erreur1',
          message: 'Erreur 1'
        },
        ERROR2: {
          name: 'erreur2',
          message: 'Erreur 2'
        },
        ERROR3: {
          name: 'erreur3',
          message: 'Erreur 3'
        }
      };

      let error1 = new WrappedError(types.ERROR1);
      let error2 = new WrappedError(types.ERROR2);

      let error3 = WrappedError.wrapMulti([error1, error2], types.ERROR3);

      expect(error3.getErrors()).to.deep.equal([
        error1,
        error2,
        error3
      ]);
    });

    it('Should return flattened errors list even with multiwrapped error', () => {
      let types = {
        ERROR1: {
          name: 'erreur1',
          message: 'Erreur 1'
        },
        ERROR2: {
          name: 'erreur2',
          message: 'Erreur 2'
        },
        ERROR3: {
          name: 'erreur3',
          message: 'Erreur 3'
        }
      };

      let error1 = new WrappedError(types.ERROR1);
      let error2 = new WrappedError(types.ERROR2);

      let error3 = WrappedError.wrapMulti([error1, error2], types.ERROR3);

      expect(error3.getErrors()).to.deep.equal([
        error1,
        error2,
        error3
      ]);
    });

    it('Should apply a map conversion function before returning the list of errors', () => {
      let types = {
        ERROR1: {
          name: 'erreur1',
          message: 'Erreur 1'
        },
        ERROR2: {
          name: 'erreur2',
          message: 'Erreur 2'
        },
        ERROR3: {
          name: 'erreur3',
          message: 'Erreur 3'
        },
        ERROR4: {
          name: 'erreur4',
          message: 'Erreur 4'
        },
        ERROR5: {
          name: 'erreur5',
          message: 'Erreur 5'
        }
      };

      let error1 = new WrappedError(types.ERROR1);
      let error2 = new WrappedError(types.ERROR2);
      let error3 = WrappedError.wrapMulti([error1, error2], types.ERROR3);

      let error4 = new WrappedError(types.ERROR4);
      let error5 = WrappedError.wrapMulti([error3, error4], types.ERROR5);

      expect(error5.getErrors(error => {
        if (error === error2) {
          return null;
        }
        return error;
      })).to.deep.equal([
        error1,
        error3,
        error4,
        error5
      ]);
    });

    it('Should filter out all child errors of a filtered out error', () => {
      let types = {
        ERROR1: {
          name: 'erreur1',
          message: 'Erreur 1'
        },
        ERROR2: {
          name: 'erreur2',
          message: 'Erreur 2'
        },
        ERROR3: {
          name: 'erreur3',
          message: 'Erreur 3'
        },
        ERROR4: {
          name: 'erreur4',
          message: 'Erreur 4'
        },
        ERROR5: {
          name: 'erreur5',
          message: 'Erreur 5'
        }
      };

      let error1 = new WrappedError(types.ERROR1);
      let error2 = new WrappedError(types.ERROR2);
      let error3 = WrappedError.wrapMulti([error1, error2], types.ERROR3);

      let error4 = new WrappedError(types.ERROR4);
      let error5 = WrappedError.wrapMulti([error3, error4], types.ERROR5);

      expect(error5.getErrors(error => {
        if (error === error3) {
          return null;
        }
        return error;
      })).to.deep.equal([
        error4,
        error5
      ]);
    });
  });
});
