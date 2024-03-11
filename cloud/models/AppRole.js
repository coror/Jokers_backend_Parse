class AppRole extends Parse.Role {
  constructor(name, ACL) {
    super(name, ACL);
  }

  static async assignUser(roleName, user) {
    // Create query for role
    const query = new Parse.Query('_Role');
    // Add filters to query
    query.equalTo('name', roleName);
    // Retrieve the role
    const role = await query.first({ useMasterKey: true });

    if (role === undefined) {
      return undefined;
    } else {
      // Get relation from role object
      const relation = role.getUsers();
      // Assign user to relation
      relation.add(user);
      await role.save(null, { useMasterKey: true });
      return role;
    }
  }

  static async devCreateRole(req) {
    const roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(true);

    const roleNames = ['coach', 'member'];

    const roles = roleNames.map((role) => new AppRole(role, roleACL));
    Parse.Object.saveAll(roles);
  }

  static registerClass() {
    Parse.Object.registerSubclass('_Role', AppRole);
  }
}

module.exports = AppRole;
