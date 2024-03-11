const deleteUnverifiedUsers = async (req) => {
  const queryFalse = new Parse.Query(Parse.User);
  queryFalse.equalTo('emailVerified', false);

  const queryUndefined = new Parse.Query(Parse.User);
  queryUndefined.equalTo('emailVerified', undefined);

  const query = Parse.Query.or(queryFalse, queryUndefined);

  const result = await query.find({ useMasterKey: true });
  Parse.Object.destroyAll(result, { useMasterKey: true });
};

const resetMonthlyScoreJob = async (req) => {
  // Get the current date
  const currentDate = new Date();

  // Check if it's the 1st day of the month
  if (currentDate.getDate() === 1) {
    console.log('Job started.');
    // Reset monthly scores for UserScore objects
    const UserScore = Parse.Object.extend('UserScore');
    const userScoreQuery = new Parse.Query(UserScore);

    await userScoreQuery.each(async (userScore) => {
      userScore.set('monthlyScore', 0);
      userScore.set('monthlySent', 0);
      userScore.set('monthlyReceived', 0);
      userScore.set('monthlyEarned', 0)
      await userScore.save(null, { useMasterKey: true });
    });

    // Reset monthly scores for User objects
    const userQuery = new Parse.Query(Parse.User);

    await userQuery.each(async (user) => {
      user.set('monthlyScore', 0);
      user.set('monthlyEarned', 0)
      await user.save(null, { useMasterKey: true });
    });

    console.log('Job completed.');
  } else {
    console.log('Monthly job skipped. It is not the 1st day of the month.');
  }
};

module.exports = { deleteUnverifiedUsers, resetMonthlyScoreJob };
