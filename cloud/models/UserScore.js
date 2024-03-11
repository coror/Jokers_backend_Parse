const Title = require('./Title');

class UserScore extends Parse.Object {
  constructor() {
    super('UserScore');
  }

  static assignUser(user, score) {
    const userScore = new UserScore();
    userScore.set('user', user);
    userScore.set('score', score); // NEVER reset. keep forever
    userScore.set('monthlyReceived', 0); // reset every 1st of the month. job?
    userScore.set('monthlySent', 0); // reset every 1st of the month. job?
    userScore.set('monthlyScore', 0);
    userScore.set('yearlyScore', 0);
    userScore.set('monthlyEarned', 0); // Initialize monthlyEarned to 0

    return userScore;
  }

  static async afterSave(req) {
    const userScore = req.object;
    const user = userScore.get('user');
    const score = userScore.get('score');

    const titleName = Title.getTitleForScore(score);

    const oldTitleName = user.get('title');
    if (titleName !== oldTitleName) {
      user.set('title', titleName);
      await user.save(null, { useMasterKey: true });
    }

    const monthlyScore = userScore.get('monthlyEarned');
    if (monthlyScore >= 15) {
      return console.log('Monthly reward earned!');
    }
  }

  static async addRemoveScore(req) {
    const { score, receiverId } = req.params;

    try {
      const receiverUserScoreQuery = new Parse.Query('UserScore');
      receiverUserScoreQuery.equalTo('user', {
        __type: 'Pointer',
        className: '_User',
        objectId: receiverId,
      });

      const receiverUserScore = await receiverUserScoreQuery.first({
        useMasterKey: true,
      });

      if (!receiverUserScore) {
        console.error('Receiver User Score not found');
        throw new Error('Receiver User Score not found');
      }

      const originalYearlyScore = receiverUserScore.get('yearlyScore');
      const originalMonthlyScore = receiverUserScore.get('monthlyScore');
      const originalTotalScore = receiverUserScore.get('score');
      const originalMonthlyEarned = receiverUserScore.get('monthlyEarned')

      const updatedYearlyScore = originalYearlyScore + score;
      const updatedMonthlyScore = originalMonthlyScore + score;
      const updatedTotalScore = originalTotalScore + score;
      const updatedMonthlyEarned = originalMonthlyEarned + score

      const receiver = new Parse.User();
      receiver.id = receiverId;
      receiver.set('userScore', updatedTotalScore); // Update userScore in _User class
      receiver.set('yearlyScore', updatedYearlyScore);
      receiver.set('monthlyScore', updatedMonthlyScore);
      receiver.set('monthlyEarned', updatedMonthlyEarned)

      receiverUserScore.set('yearlyScore', updatedYearlyScore);
      receiverUserScore.set('monthlyScore', updatedMonthlyScore);
      receiverUserScore.set('score', updatedTotalScore);
      receiverUserScore.set('monthlyEarned', updatedMonthlyEarned)

      await Parse.Object.saveAll([receiverUserScore, receiver], {
        useMasterKey: true,
      });
      console.log('Score updated successfully');
      return 'Score was successfully added/removed!';
    } catch (error) {
      console.error('An error occurred:', error);

      if (receiverUserScore) {
        receiverUserScore.set('yearlyScore', originalYearlyScore);
        receiverUserScore.set('monthlyScore', originalMonthlyScore);
        receiverUserScore.set('score', originalTotalScore);
        receiverUserScore.set('monthlyEarned', originalMonthlyEarned)

        receiver.set('userScore', originalTotalScore);

        try {
          await Parse.Object.saveAll([receiverUserScore, receiver], {
            useMasterKey: true,
          });
          console.log('Scores reverted successfully');
        } catch (revertError) {
          console.error('Error reverting scores:', revertError);
        }
      }

      throw error; // Rethrow the original error
    }
  }

  static async transferScore(req) {
    const { score, senderId, receiverId } = req.params;

    console.log('Received transferScore request:', {
      score,
      senderId,
      receiverId,
    });

    const sender = new Parse.User();
    sender.id = senderId;

    const receiver = new Parse.User();
    receiver.id = receiverId;

    console.log('TransferScore function called with params:', {
      score,
      senderId,
      receiverId,
    });

    const senderUserScoreQuery = new Parse.Query('UserScore');
    senderUserScoreQuery.equalTo('user', sender);
    const senderUserScore = await senderUserScoreQuery.first({
      useMasterKey: true,
    });

    if (!senderUserScore) {
      console.error('Sender User Score not found');
      throw new Error('Sender User Score not found');
    }
    const senderScore = senderUserScore.get('score');
    const senderMonthlyScore = senderUserScore.get('monthlyScore');
    const senderYearlyScore = senderUserScore.get('yearlyScore');

    const receiverUserScoreQuery = new Parse.Query('UserScore');
    receiverUserScoreQuery.equalTo('user', receiver);
    const receiverUserScore = await receiverUserScoreQuery.first({
      useMasterKey: true,
    });
    const receiverScore = receiverUserScore.get('score');
    const receiverMonthlyScore = receiverUserScore.get('monthlyScore');
    const receiverYearlyScore = receiverUserScore.get('yearlyScore');

    const totalSent = senderUserScore.get('monthlySent') + score <= 10;
    const totalReceived =
      receiverUserScore.get('monthlyReceived') + score <= 10;
    const condition = score > senderScore;

    console.log('Sender Monthly Sent:', senderUserScore.get('monthlySent'));
    console.log(
      'Receiver Monthly Received:',
      receiverUserScore.get('monthlyReceived')
    );
    console.log('Total Sent:', totalSent);
    console.log('Total Received:', totalReceived);

    if (condition) {
      console.log('Transaction failed due to condition or limits.');
      return "You don't have that much score!";
    }

    if (!totalReceived) {
      return 'The user cannot receive more than 10 score per month.';
    }

    if (!totalSent) {
      return 'The user cannot send more than 10 score per month.';
    }

    const senderMonthlySent = senderUserScore.get('monthlySent');
    const receiverMonthlyReceived = receiverUserScore.get('monthlyReceived');

    senderUserScore.set('score', senderScore - score);
    senderUserScore.set('monthlySent', senderMonthlySent + score);
    senderUserScore.set('monthlyScore', senderMonthlyScore - score);
    senderUserScore.set('yearlyScore', senderYearlyScore - score);

    receiverUserScore.set('score', receiverScore + score);
    receiverUserScore.set('monthlyReceived', receiverMonthlyReceived + score);
    receiverUserScore.set('monthlyScore', receiverMonthlyScore + score);
    receiverUserScore.set('yearlyScore', receiverYearlyScore + score);

    try {
      await Parse.Object.saveAll([senderUserScore, receiverUserScore], {
        useMasterKey: true,
      });

      // Update user scores in the User class for both sender and receiver

      const senderQuery = new Parse.Query('_User');
      const sender = await senderQuery.get(senderId, { useMasterKey: true });

      sender.set('userScore', senderScore - score);
      sender.set('monthlyScore', senderMonthlyScore - score);
      sender.set('yearlyScore', senderYearlyScore - score);

      const receiverQuery = new Parse.Query('_User');
      const receiver = await receiverQuery.get(receiverId, {
        useMasterKey: true,
      });

      receiver.set('userScore', receiverScore + score);
      receiver.set('monthlyScore', receiverMonthlyScore + score);
      receiver.set('yearlyScore', receiverYearlyScore + score);

      await Parse.Object.saveAll([sender, receiver], { useMasterKey: true });

      console.log('Transaction successful');
      return 'Transaction was successful!';
    } catch (error) {
      // Handle errors and revert changes if necessary
      console.error('Error transferring score:', error);

      // Revert changes to sender's score
      senderUserScore.set('score', senderScore);
      senderUserScore.set('monthlySent', senderMonthlySent);
      senderUserScore.set('monthlyScore', senderMonthlyScore);
      senderUserScore.set('yearlyScore', senderYearlyScore);

      // Revert changes to receiver's score
      receiverUserScore.set('score', receiverScore);
      receiverUserScore.set('monthlyReceived', receiverMonthlyReceived);
      receiverUserScore.set('monthlyScore', receiverMonthlyScore);
      receiverUserScore.set('yearlyScore', receiverYearlyScore);

      await Parse.Object.saveAll([senderUserScore, receiverUserScore], {
        useMasterKey: true,
      });

      // Handle the error as needed
      throw error;
    }
  }

  static registerClass() {
    Parse.Object.registerSubclass('UserScore', UserScore);
  }
}

module.exports = UserScore;
