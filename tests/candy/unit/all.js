/*global define */

define([
    'intern/chai!'
  , 'sinon-chai'
  , 'tests/candy/unit/candy'
  , 'tests/candy/unit/util'
  , 'tests/candy/unit/core'
  , 'tests/candy/unit/core/chatUser'
  , 'tests/candy/unit/core/chatRoster'
  , 'tests/candy/unit/core/chatRoom'
  , 'tests/candy/unit/core/contact'
  , 'tests/candy/unit/core/action'
  , 'tests/candy/unit/core/event'
], function (chai, sinonChai) {
  chai.use(sinonChai);
});
