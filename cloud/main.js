const AppUser = require('./models/AppUser');
const Avatar = require('./models/Avatar');
const AppRole = require('./models/AppRole');
const Group = require('./models/Group');
const { deleteUnverifiedUsers, resetMonthlyScoreJob } = require('./jobs');
const UserScore = require('./models/UserScore');
const Title = require('./models/Title');

// AppUser
Parse.Cloud.define('createUser', AppUser.createUser);

Parse.Cloud.beforeSave(Parse.User, AppUser.beforeSave);

Parse.Cloud.define('updatePassword', AppUser.updatePassword);

Parse.Cloud.define('updateAvatar', AppUser.updateAvatar);

Parse.Cloud.define('deleteUser', AppUser.delete);

Parse.Cloud.afterDelete(Parse.User, AppUser.afterDelete);

Parse.Cloud.define('updateGroup', AppUser.updateGroup)

Parse.Cloud.define('requestPasswordResetEmail', AppUser.requestPasswordResetEmail)

Parse.Cloud.define('resetPassword', AppUser.ResetPassword)

// Parse.Cloud.afterSave(Parse.User, AppUser.afterSave)

Parse.Cloud.define('getUserIdsByDisplayName', AppUser.getUserIdsByDisplayName);

Parse.Cloud.define('getAllDisplayNames', AppUser.getAllDisplayNames);

// Avatar
Parse.Cloud.define('devCreateAvatars', Avatar.devCreateAvatars);

Parse.Cloud.define('fetchAvatars', Avatar.fetchAvatars);

// AppROle
Parse.Cloud.define('devCreateRole', AppRole.devCreateRole);

// Group
Parse.Cloud.define('fetchGroups', Group.fetchGroups);

Parse.Cloud.define('devCreateGroups', Group.devCreateGroups);

Parse.Cloud.define('fetchUserGroups', Group.fetchUserGroups)

  
  

// Title
Parse.Cloud.define('devCreateTitles', Title.devCreateTitles);

// UserScore
Parse.Cloud.define('transferScore', UserScore.transferScore);

Parse.Cloud.define('addRemoveScore', UserScore.addRemoveScore);

Parse.Cloud.afterSave('UserScore', UserScore.afterSave);

// Jobs
Parse.Cloud.job('deleteUnverifiedUsers', deleteUnverifiedUsers);

Parse.Cloud.job('resetMonthlyScoresJob', resetMonthlyScoreJob);