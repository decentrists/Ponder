import React from 'react';
import { Switch, Route } from 'react-router-dom';
import HomePage from './pages/home';
import FavouritesPage from './pages/favourites';
import AddUrlPage from './pages/add-url';
import HistoryPage from './pages/history';
import SettingsPage from './pages/settings';
import NotFoundPage from './pages/not-found';

function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/favourites" component={FavouritesPage} />
      <Route exact path="/add-url" component={AddUrlPage} />
      <Route exact path="/history" component={HistoryPage} />
      <Route exact path="/settings" component={SettingsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default Routes;
