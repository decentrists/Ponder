import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { InputGroup, Form } from 'react-bootstrap';
import { ToastContext } from '../../providers/toast';
import RssButton from '../buttons/rss-button';
import Logo from '../assets/img/pot.svg';
import SyncButton from '../buttons/sync-button';
import RefreshButton from '../buttons/refresh-button';
import {
  HeaderContainer, ImageWrapper, ImageLogo,
  FormLayer, PodAlert, FormWrapper,
  CallToActions,
} from './index.elements';

function HeaderComponent({ onSubmit }) {
  const toast = useContext(ToastContext);
  const [isSearching, setIsSearching] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const query = fd.get('query');
    if (query) {
      setIsSearching(true);
      try {
        await onSubmit({ query });
        event.target.reset();
      } catch (ex) {
        console.error(ex);
        toast('Could not find podcast.', { variant: 'danger' });
      } finally {
        setIsSearching(false);
      }
    }
  }

  return (
    <HeaderContainer>
      <ImageWrapper>
        <ImageLogo
          alt=""
          src={Logo}
          width="52"
          height="54"
        />{' '}
      </ImageWrapper>
      <FormLayer>
        <PodAlert>
          {/* <SiGooglepodcasts /> */}
        </PodAlert>
        <FormWrapper>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="query">
              <InputGroup>
                <Form.Control
                  name="query"
                  disabled={isSearching}
                  placeholder="https://feeds.simplecast.com/dHoohVNH"
                />
                <RssButton disabled={isSearching} />
              </InputGroup>
            </Form.Group>
          </Form>
        </FormWrapper>
      </FormLayer>
      <CallToActions>
        <SyncButton />
        <RefreshButton />
      </CallToActions>
    </HeaderContainer>

  );
}

HeaderComponent.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
export default HeaderComponent;
