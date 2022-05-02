import React from 'react';
import PropTypes from 'prop-types';
import { useField } from 'formik';
import { Form } from 'react-bootstrap';

function Field({ children, name, label }) {
  const [field, meta, helpers] = useField(name);

  return (
    <Form.Group controlId={name}>
      {label && (
        <Form.Label>{label}</Form.Label>
      )}
      {children(field, meta, helpers)}
      {meta.error && meta.touched && (
        <Form.Control.Feedback type="invalid">{meta.error}</Form.Control.Feedback>
      )}
    </Form.Group>
  );
}

Field.propTypes = {
  children: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
};

Field.defaultProps = {
  label: null,
};

export default Field;
