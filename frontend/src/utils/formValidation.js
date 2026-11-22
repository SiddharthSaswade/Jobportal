const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTER_AND_NUMBER = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function validateLogin(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

export function validateRegister(values) {
  const errors = validateLogin(values);

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (values.password) {
    if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!LETTER_AND_NUMBER.test(values.password)) {
      errors.password = 'Password must contain a letter and a number';
    }
  }

  if (!['candidate', 'recruiter'].includes(values.role)) {
    errors.role = 'Please choose a role';
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
