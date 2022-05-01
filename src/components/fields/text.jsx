import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import Field from './field';

function TextField({ name, label, ...props }) {
  return (
    <Field name={name} label={label}>
      {field => (
        <Form.Control {...props} {...field} />
      )}
    </Field>
  );
}

// TextField.propTypes = {
//   name: PropTypes.string.isRequired,
//   label: PropTypes.string,
// };

// TextField.defaultProps = {
//   label: null,
// };

export default TextField;
