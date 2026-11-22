import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage, getValidationMessages } from '../api/client.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS, ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasErrors, validateRegister } from '../utils/formValidation.js';

const initialValues = {
  name: '',
  email: '',
  password: '',
  role: ROLES.CANDIDATE,
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerErrors([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setServerErrors([]);

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      });
      navigate('/', { replace: true });
    } catch (error) {
      const messages = getValidationMessages(error);
      setServerErrors(messages.length ? messages : [getErrorMessage(error)]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Choose how you want to use JobPortal.">
      <form onSubmit={handleSubmit} noValidate>
        {serverErrors.length > 0 && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <ul className="list-inside list-disc space-y-1">
              {serverErrors.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <FormField label="Full name" htmlFor="register-name" error={errors.name}>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="Asha Sharma"
          />
        </FormField>

        <FormField label="Email" htmlFor="register-email" error={errors.email}>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Password" htmlFor="register-password" error={errors.password}>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="At least 8 characters, with a letter and a number"
          />
        </FormField>

        <FormField label="I am a" htmlFor="register-role" error={errors.role}>
          <select
            id="register-role"
            name="role"
            value={values.role}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value={ROLES.CANDIDATE}>Candidate — looking for jobs</option>
            <option value={ROLES.RECRUITER}>Recruiter — hiring for a company</option>
          </select>
        </FormField>

        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
