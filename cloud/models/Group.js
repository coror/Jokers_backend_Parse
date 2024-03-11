class Group extends Parse.Object {
  constructor() {
    super('Group');
  }

  static async assignUser(user, groupNames) {
    try {
      const groups = [];

      for (const groupName of groupNames) {
        const query = new Parse.Query('Group');
        query.equalTo('name', groupName);
        const group = await query.first({ useMasterKey: true });

        console.log('Group Object:', group);

        if (!group) {
          console.error(`Group not found: ${groupName}`);
          throw new Error(`Group not found: ${groupName}`);
        }

        console.log('Group Object:', group);

        // Use Parse.Relation to add the user to the group
        const relation = group.relation('users');
        relation.add(user);

        console.log(`Added user to group: ${groupName}`);

        groups.push(group);
      }

      console.log('Saving groups:', groups);

      // No need to modify user.relation('groups') here

      await Parse.Object.saveAll(groups, { useMasterKey: true });

      console.log('Groups saved successfully');

      return groups;
    } catch (error) {
      throw error;
    }
  }

  static async fetchGroups(req) {
    try {
      const Group = Parse.Object.extend('Group');
      const query = new Parse.Query(Group);
      const groups = await query.find({ useMasterKey: true });
      return groups;
    } catch (error) {
      throw new Error('Error fetching groups: ' + error.message);
    }
  }

  static async fetchUserGroups(req) {
    try {
      const { userId } = req.params; // Extract userId from the request body
      console.log('Received userId:', userId);

      // Fetch the user based on the provided userId
      const userQuery = new Parse.Query(Parse.User);
      const user = await userQuery.get(userId, { useMasterKey: true });
      console.log('User found:', user);

      // Fetch the groups that the user belongs to
      const groupQuery = new Parse.Query(Group);
      groupQuery.equalTo('users', user);

      const groups = await groupQuery.find({ useMasterKey: true });
      console.log('User groups:', groups);

      return groups;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new Error('Error fetching user groups: ' + error.message);
    }
  }

  static async removeUser(user, groupName) {
    const query = new Parse.Query('Group');
    query.equalTo('name', groupName);
    const group = await query.first({ useMasterKey: true });

    if (!group) {
      return undefined;
    }

    const relation = group.relation('users');
    relation.remove(user);

    user.relation('groups').remove(group);
    await user.save(null, { useMasterKey: true });
    await group.save(null, { useMasterKey: true });

    return group;
  }

  static async devCreateGroups(req) {
    const names = [
      'Tek. Idrija 1',
      'Tek. Idrija 2',
      'Tek. Idrija 3',
      'Tek. Sp.Idrija',
      'Tek. Žiri',
      'Kickbox Žiri',
      'Kickbox Idrija',
      'Izbor starejših',
      'Tek. Logatec',
      'Tek. Črni Vrh',
    ];

    const groups = names.map((name) => {
      const newGroup = new Group();
      newGroup.set('name', name);
      return newGroup;
    });

    Parse.Object.saveAll(groups);
  }

  static registerClass() {
    Parse.Object.registerSubclass('Group', Group);
  }
}

module.exports = Group;
