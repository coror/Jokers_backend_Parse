const Group = require('./Group');
const AppRole = require('./AppRole');
const UserScore = require('./UserScore');
const Avatar = require('./Avatar');
const Title = require('./Title');

const {
  validateName,
  validateSurname,
  validatePassword,
  validateRoleName,
  validateUserScore,
} = require('../utils/validator');

class AppUser extends Parse.User {
  constructor(attrs) {
    super(attrs);
  }

  static async createUser(req) {
    const {
      name,
      surname,
      email,
      password,
      groupNames, // Change to an array of group names
      roleName,
      userScore = 0,
    } = req.params;

    const userData = {
      name,
      surname,
      email,
      username: email,
      password,
      groupNames, // Change to an array of group names
      roleName,
      userScore,
    };

    let user; // Declare the user variable outside the try block

    try {
      validateName(name);
      validateSurname(surname);
      validatePassword(password);
      validateRoleName(roleName);
      validateUserScore(userScore);

      user = new AppUser(userData);

      await user.signUp();

      // Iterate over the array of group names and add each group to the user's groups relation
      await Group.assignUser(user, groupNames);

      const role = await AppRole.assignUser(roleName, user);
      const scoreObject = UserScore.assignUser(user, userScore);
      const score = scoreObject.score;
      user.set('userScore', score);
      user.set('yearlyScore', 0);
      user.set('monthlyScore', 0);
      user.set('monthlyEarned', 0);

      const titleName = Title.getTitleForScore(scoreObject);

      const title = await Title.assignUser(user, titleName);
      user.set('title', titleName);

      await Parse.Object.saveAll([user, role, scoreObject, title], {
        useMasterKey: true,
      });

      return 'User was created successfully!';
    } catch (e) {
      if (user && user.id) {
        // User was partially created, delete it to maintain data integrity
        await user.destroy({ useMasterKey: true });
      }
      throw new Error(e);
    }
  }

  static async beforeSave(req) {
    const original = req.original;

    if (original === undefined) {
      // sets only if it is the first time the user is being created
      const randomAvatar = await Avatar.randomPickAvatar();

      req.object.set('avatar', randomAvatar);
    }

    const name = req.object.get('name');
    const surname = req.object.get('surname');
    const displayName = `${name} ${surname}`;

    req.object.set('displayName', displayName);
  }

  static async updateGroup(req) {
    const { userId, groupNames } = req.params;
    const userQuery = new Parse.Query('_User');
    const user = await userQuery.get(userId, { useMasterKey: true });

    if (!user) {
      console.error(`User not found: ${userId}`);
      throw new Error(`User not found: ${userId}`);
    }

    try {
      // Fetch all groups that the user belongs to

      const existingUserGroupsQuery = new Parse.Query('Group');
      existingUserGroupsQuery.equalTo('users', user);
      const existingUserGroups = await existingUserGroupsQuery.find({
        useMasterKey: true,
      });

      // Remove user from groups that are not in groupNames
      for (const group of existingUserGroups) {
        if (!groupNames.includes(group.get('name'))) {
          const relation = group.relation('users');
          relation.remove(user);
          await group.save(null, { useMasterKey: true });
          console.log(`Removed user from group: ${group.get('name')}`);
        }
      }

      // Add relation to the group
      const assignUserToGroupsQuery = new Parse.Query('Group');
      assignUserToGroupsQuery.containedIn('name', groupNames);
      const assignUserToGroups = await assignUserToGroupsQuery.find({
        useMasterKey: true,
      });

      for (const group of assignUserToGroups) {
        const relation = group.relation('users');
        relation.add(user);
        await group.save(null, { useMasterKey: true });
      }

      // Update the groupNames field in the user object
      user.set('groupNames', groupNames);

      // Save the updated user object
      await user.save(null, { useMasterKey: true });
      console.log('User object saved successfully');

      return assignUserToGroups;
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(req) {
    const { objectId, oldPassword, newPassword, groupName } = req.params;
    const userQuery = new Parse.Query('_User');
    const user = await userQuery.get(objectId, { useMasterKey: true });

    if (user === undefined) {
      return 'User was not found!';
    }

    // Validate the old password
    const isOldPasswordValid = await Parse.User.logIn(
      user.get('username'),
      oldPassword
    );
    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    // Validate the new password (using your validatePassword function)
    validatePassword(newPassword);

    // Update the password
    user.set('password', newPassword);
    await user.save(null, { useMasterKey: true });

    return 'Password was successfully updated!';
  }

  static async addUserToGroup(user, groupName) {
    const group = await Group.assignUser(user, groupName);
    if (group) {
      // Successfully added user to group
      return 'User was added to the group successfully!';
    } else {
      return 'Group not found.';
    }
  }

  static async removeUserFromGroup(user, groupName) {
    const group = await Group.removeUser(user, groupName);
    if (group) {
      // Successfully removed user from group
      return 'User was removed from the group successfully!';
    } else {
      return 'Group not found.';
    }
  }

  static async updateAvatar(req) {
    const { objectId, avatarId } = req.params;
    const userQuery = new Parse.Query('_User');

    try {
      const user = await userQuery.get(objectId, { useMasterKey: true });

      if (user === undefined) {
        return 'User was not found!';
      }

      if (avatarId !== undefined) {
        user.set('avatar', {
          __type: 'Pointer',
          className: 'Avatar',
          objectId: avatarId,
        });
      }

      await user.save(null, { useMasterKey: true });

      return 'Password/Avatar was successfully updated!';
    } catch (error) {
      throw error;
    }
  }

  static async getUserIdsByDisplayName(req) {
    const { displayName } = req.params;

    const query = new Parse.Query('_User');
    query.equalTo('displayName', displayName);

    try {
      const user = await query.first({ useMasterKey: true });
      if (user) {
        return { userId: user.id };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user ID by displayName:', error);
      throw new Error('Error fetching user ID');
    }
  }

  static async getAllDisplayNames(req) {
    const query = new Parse.Query('_User');
    query.select(['displayName', 'roleName', 'groupName']); // Include the 'role' field

    try {
      const users = await query.find({ useMasterKey: true });
      const usersWithRoles = users.map((user) => ({
        displayName: user.get('displayName'),
        role: user.get('roleName'), // Assuming 'role' is the field name for the user's role
        groupName: user.get('groupName'),
      }));

      return { userDisplayNames: usersWithRoles };
    } catch (error) {
      console.error('Error fetching user display names:', error);
      throw new Error('Error fetching user display names');
    }
  }

  static async requestPasswordResetEmail(req) {
    const { email } = req.params;

    try {
      const userQuery = new Parse.Query('_User');
      userQuery.equalTo('email', email);
      const user = await userQuery.first();

      if (!user || user === undefined) {
        // Return a custom error message in the response
        return {
          success: false,
          message: 'Email address not found in the database',
          status: 404, // Set the status code to 404 (Not Found)
        };
      }

      await Parse.User.requestPasswordReset(email);

      return {
        success: true,
        message: 'Password reset request sent successfully!',
      };
    } catch (error) {
      console.log(error);
      // You can handle different types of errors here if needed
      return {
        success: false,
        message: 'An error occurred while sending the password reset email.',
        status: 500, // Set the status code to 500 (Internal Server Error)
      };
    }
  }

  static async ResetPassword(req) {
    try {
      // Extract the token from the request parameters
      const { token, newPassword } = req.params;

      // Validate the token, perform any necessary checks, and decode it if needed

      // Use the token to reset the user's password
      await Parse.User.resetPasswordByToken(token, newPassword);

      return {
        success: true,
        message: 'Password reset successfully!',
      };
    } catch (error) {
      console.error(error);
      throw new Error('An error occurred while resetting the password.');
    }
  }

  static async delete(req) {
    const { objectId } = req.params;
    const query = new Parse.Query('_User');
    const user = await query.get(objectId, { useMasterKey: true });

    if (user === undefined) {
      return 'User was not found';
    }

    user.destroy({ useMasterKey: true });
  }

  static async afterDelete(req) {
    const user = req.object;

    const queryUserScore = new Parse.Query('UserScore');
    queryUserScore.equalTo('user', user);

    const result = await queryUserScore.find();
    Parse.Object.destroyAll(result);
  }

  static registerClass() {
    Parse.Object.registerSubclass('_User', AppUser);
  }
}

module.exports = AppUser;
