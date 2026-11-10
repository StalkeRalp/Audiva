export function validateAuth(values) {
  const errors = {};

  if (!values.email) {
    errors.email = "L'email est requis.";
  }

  if (!values.password || values.password.length < 6) {
    errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
  }

  return errors;
}
