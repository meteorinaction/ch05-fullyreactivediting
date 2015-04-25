Meteor.startup(function () {
  if (HousesCollection.find().count() === 0) {
    var houses = [{
      name: 'Manuel',
      plants: [{
        color: 'Red',
        instructions: '3 pots/week'
      }, {
        color: 'Yellow',
        instructions: 'keep humid'
      }]
    }, {
      name: 'Stephan',
      plants: [{
        color: 'Red',
        instructions: '3 pots/week'
      }, {
        color: 'White',
        instructions: 'water daily'
      }],
      animals: [ // this will never be used in our application
        {
          name: 'Danbo',
          instructions: '1 carrot/day'
        }
      ]
    }];

    while (houses.length > 0) {
      HousesCollection.insert(houses.pop());
    }
    console.log('Added fixtures');
  }
});