'use strict';

const validateName = (name) => {
  if (!name || name.trim().length === 0 || name.trim().length > 10) {
    throw new Error('Please provide a valid name!');
  }
};

const validateSurname = (surname) => {
  if (!surname || surname.trim().length === 0 || surname.trim().length > 10) {
    throw new Error('Please provide a valid surname!');
  }
};

const validatePassword = (password) => {
  if (
    !password ||
    password.trim().length < 8
    // !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/)
  ) {
    throw new Error(
      'Password must be at least 8 characters long!'
    );
  }
};

const validateGroupName = (groupName) => {
  const validGroupNames = [
    'Tek. Idrija 1',
    'Tek. Idrija 2',
    'Tek. Idrija 3',
    'Tek. Sp.Idrija',
    'Tek. Žiri',
    'Kickbox Žiri',
    'Kickbox Idrija',
    'Izbor starejših',
    'Tek. Logatec',
    'Tek. Črni Vrh'
  ];;

  if (!validGroupNames.includes(groupName)) {
    throw new Error('Invalid group. Please choose a valid group!');
  }
};

const validateRoleName = (roleName) => {
  const validRoleNames = ['coach', 'member'];

  if (!validRoleNames.includes(roleName.toLowerCase())) {
    throw new Error('Invalid role. Please choose a valid role!');
  }
};

const validateUserScore = (userScore) => {
  if (userScore < 0) {
    throw new Error('Invalid score. Score cannot be a negatice number!');
  }
};

const validateEmail = (email) => {
  // Regular expression for a basic email validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }
};


module.exports = {
  validateName,
  validateSurname,
  validatePassword,
  validateGroupName,
  validateRoleName,
  validateUserScore,
  validateEmail
};
