// just for the sake of silencing TS
export {};

// import React, { useContext } from 'react';
// import styled from 'styled-components';
// import { Formik, Form as FormikForm, Field } from 'formik';
// import { Form, Button } from 'react-bootstrap';
// import { FaArrowRight } from 'react-icons/fa';
// import * as Yup from 'yup';
// import { ToastContext } from '../providers/toast';
// // eslint-disable-next-line import/named
// import { addUrl } from '../client';

// const LowerControls = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   margin-top: .8rem;
// `;

// const validationSchema = Yup.object().shape({
//   rssUrl: Yup.string().url().required().trim(),
//   isPublic: Yup.boolean().required(),
// }).required();

// function AddUrlForm() {
//   const toast = useContext(ToastContext);

//   async function handleSubmit({ rssUrl, isPublic }) {
//     return addUrl(rssUrl, isPublic)
//       .then(() => {
//         toast({
//           text: 'Subscribed',
//           variant: 'success',
//         });
//       })
//       .catch(ex => {
//         console.error(ex);
//         toast({
//           text: 'Unsubscribed',
//           variant: 'danger',
//         });
//       });
//   }

//   return (
//     <Formik
//       validationSchema={validationSchema}
//       initialValues={{
//         rssUrl: '',
//         isPublic: false,
//       }}
//       onSubmit={handleSubmit}
//     >
//       {({ submitting }) => (
//         <FormikForm>
//           <Form.Group controlId="rssUrl">
//             <Field
//               component={Form.Control}
//               name="rssUrl"
//               placeholder="https://example.com/rss"
//               disabled={submitting}
//             />
//           </Form.Group>

//           <LowerControls>
//             <Form.Group controlId="isPublic">
//               <Field type="checkbox" name="isPublic" disabled={submitting} />
//               <Form.Label>Public</Form.Label>
//             </Form.Group>

//             <Button type="submit" variant="info" disabled={submitting}>
//               <FaArrowRight />
//             </Button>
//           </LowerControls>
//         </FormikForm>
//       )}
//     </Formik>
//   );
// }

// export default AddUrlForm;
