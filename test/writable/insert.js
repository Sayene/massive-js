'use strict';

describe('insert', function () {
  let db;

  before(function () {
    return resetDb('updatables').then(instance => db = instance);
  });

  after(function () {
    return db.instance.$pool.end();
  });

  it('inserts a record and returns an object', function () {
    return db.normal_pk.insert({field1: 'epsilon'}).then(res => {
      assert.equal(res.field1, 'epsilon');
    });
  });

  it('inserts multiple normal_pk and returns an array', function () {
    return db.normal_pk.insert([{field1: 'zeta'}, {field1: 'eta'}]).then(res => {
      assert.equal(res.length, 2);
      assert.equal(res[0].field1, 'zeta');
      assert.equal(res[1].field1, 'eta');
    });
  });

  it('combines keys of partial objects on insert', function () {
    return db.normal_pk.insert([
      {field1: 'theta', field2: 'ateht'},
      {field1: 'iota', array_field: ['one', 'two']}
    ]).then(res => {
      assert.equal(res.length, 2);
      assert.equal(res[0].field1, 'theta');
      assert.equal(res[0].field2, 'ateht');
      assert.equal(res[1].field1, 'iota');
      assert.deepEqual(res[1].array_field, ['one', 'two']);
    });
  });

  it('rejects when a partial record excludes a constrained field', function () {
    return db.normal_pk.insert([
      {field1: 'ephemeral'},
      {field2: 'insufficient'}
    ]).then(() => {
      assert.fail();
    }).catch(() => {});
  });

  it('inserts nothing', function () {
    return db.normal_pk.insert([]).then(res => {
      assert.equal(res.length, 0);
    });
  });

  it('inserts array fields', function () {
    return db.normal_pk.insert({field1: 'kappa', array_field: ['one', 'two']}).then(res => {
      assert.equal(res.field1, 'kappa');
      assert.deepEqual(res.array_field, ['one', 'two']);
    });
  });

  it('inserts empty array fields with a literal {}', function () {
    return db.normal_pk.insert({field1: 'lambda', array_field: '{}'}).then(res => {
      assert.equal(res.field1, 'lambda');
      assert.deepEqual(res.array_field, []);
    });
  });

  it('inserts empty array fields', function () {
    return db.normal_pk.insert({field1: 'mu', array_field: []}).then(res => {
      assert.equal(res.field1, 'mu');
      assert.deepEqual(res.array_field, []);
    });
  });

  it('inserts a record with a UUID key', function () {
    return db.uuid_pk.insert({field1: 'a'}).then(res => {
      assert.isOk(res.id);
      assert.equal(res.field1, 'a');
    });
  });

  it('inserts a record into a table with a Cased Name', function () {
    return db.CasedName.insert({Field1: 'b'}).then(res => {
      assert.equal(res.Field1, 'b');
    });
  });

  it('inserts into a qualifying view', function () {
    return db.normal_as.insert({field1: 'aardvark'}).then(res => {
      assert.equal(res.field1, 'aardvark');
    });
  });

  it('inserts into a view and returns a result outside the scope', function* () {
    const res = yield db.normal_as.insert({field1: 'pangolin'});

    assert.equal(res.field1, 'pangolin');

    const pangolins = yield db.normal_as.count({field1: 'pangolin'});

    assert.equal(pangolins, 0);
  });

  it('returns an error when a constraint is violated', function () {
    return db.normal_pk.insert({field1: null}).catch(err => {
      assert.equal(err.code, '23502');
      assert.isOk(err.detail);
    });
  });

  it('applies options', function () {
    return db.normal_pk.insert({field1: 'nu'}, {build: true}).then(res => {
      assert.deepEqual(res, {
        sql: 'INSERT INTO "normal_pk" ("field1") VALUES ($1) RETURNING *',
        params: ['nu']
      });
    });
  });

  it('rejects if not insertable', function* () {
    let caught = false;

    try {
      db.normal_pk.insertable = false;

      yield db.normal_pk.insert({field1: 'sixteen'});
    } catch (err) {
      caught = true;

      assert.equal(err.message, 'normal_pk is not writable');
    } finally {
      db.normal_pk.insertable = true;

      if (!caught) {
        assert.fail();
      }
    }
  });

  it('rejects if no data', function () {
    return db.normal_pk.insert()
      .then(() => { assert.fail(); })
      .catch(err => {
        assert.equal(err.message, 'Must provide data to insert');
      });
  });
});
