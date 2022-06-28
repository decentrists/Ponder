import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  useMediaQuery, useTheme,
} from '@mui/material';
import createCytoscape from './cytoscape';
import getElementsFromSubscriptions from './get-elements-from-subscriptions';
import PodcastDetails from '../podcast-details';
import ToggleBtn from '../buttons/toggle-button'; // This button can be used for another fn
import { Podcast } from '../../client/interfaces';
import { ExtendedCore } from './cytoscape/interfaces';
import { mobileLayout, desktopLayout } from './cytoscape/layout';

const PodGraphContainer = styled.div`
  position: relative;
`;

const PodGraphInnerContainer = styled.div`
  max-height: 600px;
  min-height: 600px;
  margin: 3.5rem .8rem .8rem .8rem;
  background-color: rgba(13, 13, 13, 1);
  border: 2px solid rgba(38,38,38,1);
  border-radius: 1rem;
  padding: 16px;
  @media only screen and (max-width: 960px) {
    min-height: 400px;
  }
`;

interface Props {
  subscriptions: Podcast[];
}

declare global {
  interface Window {
    cy : ExtendedCore;
  }
}

const PodGraph : React.FC<Props> = ({ subscriptions }) => {
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cy, setCy] = useState<ExtendedCore>();
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const selectedPodcast = subscriptions
    .find(subscription => subscription.subscribeUrl === selectedPodcastId);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  if (selectedPodcastId && !selectedPodcast) {
    console.warn('Could not find a podcast with the selected ID. You should not be seeing this :)');
  }

  useEffect(() => {
    const layout = isSm ? mobileLayout : desktopLayout;
    const cyto = createCytoscape(
      el.current,
      layout,
      getElementsFromSubscriptions(subscriptions),
      {
        setSelectedPodcastId: id => setSelectedPodcastId(id),
      },
    );
    setCy(cyto);
    window.cy = cyto;

    return () => {
      cyto.destroy();
    };
  }, [subscriptions, isSm]);

  return (
    <PodGraphContainer>
      <PodGraphInnerContainer ref={el} />
      {selectedPodcast && (
      <PodcastDetails
        {...selectedPodcast}
        isOpen={!!selectedPodcast}
        close={() => setSelectedPodcastId(null)}
      />
      )}
      { /* @ts-ignore  */}
      <ToggleBtn />  {/* this btn has no fn yet,it can be added later */}
    </PodGraphContainer>
  );
};

export default PodGraph;
