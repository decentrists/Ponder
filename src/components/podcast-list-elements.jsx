import { Image } from 'react-bootstrap';
import styled from 'styled-components';

export const EventWrapper = styled.div`
  margin-top:  32px;
  min-width: 100%;
  display: flex;
  padding: 0 16px;
  @media only screen and (max-width: 960px) {
    flex-direction: column;
  }
`;

export const LeftPane = styled.div`
  display: inline;
  max-width: 270px;
  @media only screen and (max-width: 960px) {
    max-width: 100%;
  }
`;

export const RightPane = styled.div`
  width: 100%;
`;

export const CategoryHeader = styled.h5`
  color: white;
  font-weight: 700;
  margin-bottom: 0.75rem;
`;

export const CategoryList = styled.div`
  display: flex;
  row-gap: 0.625rem;
  column-gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
`;

export const CategoryItem = styled.div`
  cursor: default;
  border-radius: 0.75rem;
  border-width: 1px;
  border-color: rgba(72, 72, 72, 1);
  background-color: rgba(16, 16, 16, 1);
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  padding-left: 0.875rem;
  padding-right: 0.875rem;
  font-size: 11px;
  font-weight: 700;
  color: rgba(206, 206, 206, 1);
`;

export const SubscriptionHeader = styled.h5`
  color: rgba(255, 255, 255, 1);
  font-weight: 700;
  margin-bottom: 0.75rem;
`;

export const ListContainer = styled.div`
  overflow: overlay;
  padding: 0.75rem;
  background-color: rgba(13, 13, 13, 1);
  border: 2px solid rgba(38, 38, 38, 1);
  border-radius: 1rem;
  max-width: 830px;
  height: 24rem;
`;

export const ListItem = styled.div`
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 0.5rem;
  justify-content: space-between;
  align-items: center;
  cursor: default;
  display: flex;
  &:hover {
    background-color: #030303;
  }
`;

export const TitleDetail = styled.div`
  display: flex;
  align-items: center;
`;

export const PodcastImage = styled(Image)`
  object-fit: cover;
  border-radius: 0.75rem;
  width: 3rem;
  height: 3rem;
  margin-right: 0.75rem;
  @media only screen and (max-width: 960px) {
    width: 2rem;
    height: 2rem;
  }
`;

export const TitleHeader = styled.h2`
  color: rgba(255, 255, 255, 1);
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  @media only screen and (max-width: 960px) {
    width: auto;
  }
`;

export const MetaDetail = styled.div`
  display: flex;
`;

export const LatestRelease = styled.div`
  margin-right: 2rem;
  display: flex;
  align-items: center;
  color: rgba(104, 104, 104, 1);
  font-size: 12px;
`;

export const TimeRelease = styled.small`
  font-size: 9px;
  margin-top: 1px;
  text-transform: capitalize;
  color: rgba(104, 104, 104, 1);
  line-height: 1rem;
`;

export const CallToAction = styled.div`
  display: flex;
  align-items: center;
  margin-left: 5rem;
  @media only screen and (max-width: 960px) {
    margin-left: auto;
  }
`;

export const ActionBtn = styled.div`
  border: solid 2px rgba(255, 255, 255, 0.4);
  border-radius: 9999px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 85px;
  height: 2.5rem;
  @media only screen and (max-width: 960px) {
    padding: 0;
    border: none;
    width: auto;
  }
`;
