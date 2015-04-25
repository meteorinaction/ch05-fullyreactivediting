LocalHouse = new Mongo.Collection(null);
var newHouse = {
  name: '',
  plants: [],
  lastsave: 'never',
  status: 'unsaved'
};
Session.setDefault('selectedHouseId', '');

Tracker.autorun(function () {
  console.log('The selectedHouse ID is: ' +
    Session.get('selectedHouseId')
  );
});

Template.registerHelper('selectedHouse', function () {
  return LocalHouse.findOne(Session.get('selectedHouseId'));
});

Template.registerHelper('withIndex', function (list) {
  var withIndex = _.map(list, function (v, i) {
    if (v === null) return;
    v.index = i;
    return v;
  });
  return withIndex;
});

Template.notificationArea.helpers({
  notification: function () {
    return Session.get('notification');
  }
});

Template.selectHouse.helpers({
  housesNameId: function () {
    return HousesCollection.find({}, {
      fields: {
        name: 1,
        _id: 1
      }
    });
  },
  isSelected: function () {
    return Session.equals('selectedHouseId', this._id) ? 'selected' : '';
  }
});
Template.selectHouse.events({
  'change #selectHouse': function (evt) {
    var selectedId = evt.currentTarget.value;
    var newId = LocalHouse.upsert(
      selectedId,
      HousesCollection.findOne(selectedId) || newHouse
    ).insertedId;
    if (!newId) newId = selectedId;
    Session.set('selectedHouseId', newId);
  }
});

Template.showHouse.events({
  'click button#delete': function (evt) {
    var id = this._id;
    var deleteConfirmation = confirm('Really delete this house?');
    if (deleteConfirmation) {
      // remove from remote db
      HousesCollection.remove(id);
      // remove from local collection
      LocalHouse.remove(id);
    }
  }
});

Template.plantDetails.helpers({
  isWatered: function () {
    var plantId = Session.get('selectedHouseId') + '-' + this.color;
    return Session.get(plantId) ? 'disabled' : '';
  }
});
Template.plantDetails.events({
  'click button.water': function (evt) {
    var plantId = $(evt.currentTarget).attr('data-id');
    Session.set(plantId, true);
    var lastvisit = new Date();
    HousesCollection.update({
      _id: Session.get('selectedHouseId')
    }, {
      $set: {
        lastvisit: lastvisit
      }
    });
  }
});

Template.houseForm.onCreated(function () {
  this.autorun(function () {
    if (HousesCollection.findOne(Session.get('selectedHouseId')) &&
      LocalHouse.findOne(Session.get('selectedHouseId')).lastsave <
      HousesCollection.findOne(Session.get('selectedHouseId')).lastsave) {
      Session.set('notification', {
        type: 'warning',
        text: 'This document has been changed inside the database!'
      });
    } else if (LocalHouse.findOne(Session.get('selectedHouseId')) && LocalHouse.findOne(Session.get('selectedHouseId')).status === 'unsaved') {
      Session.set('notification', {
        type: 'reminder',
        text: 'Remember to save your changes'
      });
    } else {
      Session.set('notification', '');
    }
  })
});
Template.houseForm.events({
  'keyup input#house-name': function (evt) {
    evt.preventDefault();
    var modifier = {
      $set: {
        'name': evt.target.value,
        'status': 'unsaved'
      }
    };
    updateLocalHouse(Session.get('selectedHouseId'), modifier);
  },
  'click button.addPlant': function (evt) {
    evt.preventDefault();
    var newPlant = {
      color: '',
      instructions: ''
    };
    var modifier = {
      $push: {
        'plants': newPlant
      },
      $set: {
        'status': 'unsaved'
      }
    };
    updateLocalHouse(Session.get('selectedHouseId'), modifier);
  },
  'click button#save-house': function (evt) {
    evt.preventDefault();
    var id = Session.get('selectedHouseId');
    var modifier = {
      $set: {
        'lastsave': new Date(),
        'status': 'saved'
      }
    };
    updateLocalHouse(id, modifier);
    // persist house document in remote db
    HousesCollection.upsert({
        _id: id
      },
      LocalHouse.findOne(id)
    );
  }
});

Template.plantFieldset.events({
  'click button.removePlant': function (evt) {
    evt.preventDefault();
    var index = evt.target.getAttribute('data-index');
    var plants = Template.parentData(1).plants;
    plants.splice(index, 1);
    var modifier = {
      $set: {
        'plants': plants,
        'status': 'unsaved'
      }
    };
    updateLocalHouse(Session.get('selectedHouseId'), modifier);
  },
  'keyup input.color, keyup input.instructions': function (evt) {
    evt.preventDefault();
    var index = evt.target.getAttribute('data-index');
    var field = evt.target.getAttribute('class');
    var plantProperty = 'plants.' + index + '.' + field;
    var modifier = {
      $set: {}
    };
    modifier['$set'][plantProperty] = evt.target.value;
    modifier['$set'].status = 'unsaved';

    updateLocalHouse(Session.get('selectedHouseId'), modifier);
  }
});

updateLocalHouse = function (id, modifier) {
  LocalHouse.update({
      '_id': id
    },
    modifier
  );
};