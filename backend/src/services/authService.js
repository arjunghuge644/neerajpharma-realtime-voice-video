const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config/env');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password, role, specialization }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'PATIENT',
      specialization: role === 'DOCTOR' ? specialization || null : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      specialization: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

/**
 * Authenticate existing user login
 */
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const userPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    specialization: user.specialization,
    createdAt: user.createdAt,
  };

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: userPayload, token };
};

/**
 * Get User Profile by ID
 */
const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      specialization: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
