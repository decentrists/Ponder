import React from 'react';
import PropTypes from 'prop-types';
import { RiMapPinTimeLine } from 'react-icons/ri';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { podcastPropType } from '../prop-types';
import {
  EventWrapper, LeftPane,
  CategoryHeader, CategoryList,
  CategoryItem, RightPane,
  SubscriptionHeader, ListContainer,
  ListItem, TitleDetail, PodcastImage,
  TitleHeader, MetaDetail, LatestRelease,
  TimeRelease, CallToAction, ActionBtn,
} from './podcast-list-elements';
import RemoveBtn from './remove-button';

dayjs.extend(relativeTime);

function PodcastList({ subscriptions, unsubscribe }) {
  return (
    <EventWrapper>
      <LeftPane>
        <CategoryHeader>
          Popular
        </CategoryHeader>
        <CategoryList>
          <CategoryItem>
            Comedy
          </CategoryItem>
          <CategoryItem>
            Political
          </CategoryItem>
          <CategoryItem>
            Tech
          </CategoryItem>
          <CategoryItem>
            Sports
          </CategoryItem>
          <CategoryItem>
            Comedy
          </CategoryItem>
        </CategoryList>
      </LeftPane>
      <RightPane>
        <SubscriptionHeader>Subscription</SubscriptionHeader>
        <ListContainer>

          { subscriptions.length ? (
            <div>
              {subscriptions.map(subscription => (
                <ListItem key={subscription.subscribeUrl}>
                  <TitleDetail>
                    <PodcastImage src={subscription.imageUrl} alt={subscription.title} />
                    <div>
                      <TitleHeader>
                        {subscription.title}
                      </TitleHeader>
                      <MetaDetail>
                        <LatestRelease>
                          <RiMapPinTimeLine />
                          <TimeRelease>
                            {dayjs(subscription.firstPublishedAt).fromNow()}
                          </TimeRelease>

                        </LatestRelease>
                      </MetaDetail>
                    </div>
                  </TitleDetail>

                  <CallToAction>
                    <ActionBtn>
                      <RemoveBtn onClick={() => unsubscribe(subscription.subscribeUrl)} />
                      {/* <div>bt2</div> */}
                    </ActionBtn>

                  </CallToAction>
                </ListItem>

              ))}
            </div>
          ) : (
            <p>There are no podcasts to display&hellip;</p>
          )}
        </ListContainer>
      </RightPane>
    </EventWrapper>
  );
}
PodcastList.propTypes = {
  subscriptions: PropTypes.arrayOf(PropTypes.shape(podcastPropType).isRequired).isRequired,
  unsubscribe: PropTypes.arrayOf(PropTypes.shape(podcastPropType).isRequired).isRequired,
};
export default PodcastList;
