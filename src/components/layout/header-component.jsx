import React, { useState, useContext } from 'react';
import { InputGroup, Form, Container } from 'react-bootstrap';
import { Box } from '@mui/material';
import { ToastContext } from '../../providers/toast';
import RssButton from '../buttons/rss-button';
import SyncButton from '../buttons/sync-button';
import RefreshButton from '../buttons/refresh-button';
import style from './index-elements.module.scss';
import { PotIcon } from '../assets/img/pot';

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
    <Container className={style['header-container']}>
      <Box className={style['image-wrapper']}>
        <PotIcon />
      </Box>
      <Box className={style['form-layer']}>
        <Box className={style['pod-alert']}>
          {/* <SiGooglepodcasts /> */}
        </Box>
        <Box className={style['form-wrapper']}>
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
        </Box>
      </Box>
      <Box className={style['call-to-actions']}>
        <SyncButton />
        <RefreshButton />
      </Box>
    </Container>

  );
}

export default HeaderComponent;
